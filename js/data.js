/* ===========================================
   ALLEGRO ANALYTICS DASHBOARD - DATA
   Ladowanie i przetwarzanie danych
   =========================================== */

// Stan danych
let rawData = [];
let processedData = {
  products: [],
  markets: {},
  kpis: {},
  topProducts: [],
  classifiedProducts: {
    scale: [],
    optimize: [],
    phaseOut: [],
    averages: {},
  },
};

/**
 * Laduje dane z webhooka n8n lub pliku lokalnego
 */
async function loadData() {
  try {
    let jsonData;

    if (CONFIG.DATA_SOURCE === 'webhook') {
      // Ladowanie z webhooka n8n
      console.log('Ladowanie danych z webhooka:', CONFIG.WEBHOOK_URL);
      const response = await fetch(CONFIG.WEBHOOK_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      jsonData = await response.json();

      // n8n moze zwracac format: [{ json: {...} }, { json: {...} }]
      // Wyciagamy same obiekty
      if (Array.isArray(jsonData) && jsonData.length > 0 && jsonData[0].json) {
        jsonData = jsonData.map(item => item.json);
      }

    } else {
      // Ladowanie z pliku lokalnego (do testow)
      console.log('Ladowanie danych z pliku:', CONFIG.DATA_FILE);
      const response = await fetch(CONFIG.DATA_FILE);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      jsonData = JSON.parse(text);
    }

    rawData = jsonData;
    processedData = processData(rawData);
    return processedData;
  } catch (error) {
    console.error('Blad ladowania danych:', error);
    throw error;
  }
}

/**
 * Przetwarza surowe dane
 */
function processData(data) {
  // Filtruj blackliste
  const filteredProducts = data.filter(product =>
    !CONFIG.BLACKLIST_SIGNATURES.includes(product.sygnatura)
  );

  // Filtruj po minimalnej liczbie wyswietlen
  const products = CONFIG.MIN_VIEWS_FOR_LISTING > 0
    ? filteredProducts.filter(p =>
        p.podsumowanie_globalne.suma_wyswietlen_total >= CONFIG.MIN_VIEWS_FOR_LISTING
      )
    : filteredProducts;

  // Agreguj rynki
  const markets = aggregateMarkets(products);

  // Oblicz KPI
  const kpis = calculateKPIs(products, markets);

  // Klasyfikacja produktow (SKALUJ/OPTYMALIZUJ/WYGAS)
  const classifiedProducts = classifyAllProducts(products);

  // Top produkty (zachowane dla kompatybilnosci, ale nieuzywane)
  const topProducts = getTopProducts(products, CONFIG.TOP_PRODUCTS_COUNT);

  return {
    products,
    markets,
    kpis,
    topProducts,
    classifiedProducts,
  };
}

/**
 * Agreguje dane per rynek
 */
function aggregateMarkets(products) {
  const markets = {};

  products.forEach(product => {
    Object.entries(product.podsumowanie_per_rynek || {}).forEach(([marketId, marketData]) => {
      if (!markets[marketId]) {
        markets[marketId] = {
          id: marketId,
          name: CONFIG.MARKETS[marketId]?.name || marketId,
          flag: CONFIG.MARKETS[marketId]?.flag || '',
          code: CONFIG.MARKETS[marketId]?.code || marketId,
          totalSales: 0,
          totalViews: 0,
          totalWatching: 0,
          auctionCount: 0,
          productCount: 0,
        };
      }

      markets[marketId].totalSales += marketData.suma_sprzedanych || 0;
      markets[marketId].totalViews += marketData.suma_wyswietlen || 0;
      markets[marketId].totalWatching += marketData.suma_obserwujacych || 0;
      markets[marketId].auctionCount += marketData.liczba_aukcji || 0;
      markets[marketId].productCount += 1;
    });
  });

  // Dodaj konwersje
  Object.values(markets).forEach(market => {
    market.conversion = market.totalViews > 0
      ? (market.totalSales / market.totalViews) * 100
      : 0;
    market.classification = classifyMarket(market.totalSales, market.conversion);
  });

  return markets;
}

/**
 * Oblicza glowne KPI
 */
function calculateKPIs(products, markets) {
  let totalSales = 0;
  let totalViews = 0;

  // Nowe KPI z summary_last_30_days
  let totalRevenue = 0;
  let totalCommissionSuc = 0;
  let totalCommissionFsf = 0;
  let totalProfit = 0;
  let totalTransactions = 0;
  let totalSoldQuantity30Days = 0;

  products.forEach(p => {
    const sales = p.podsumowanie_globalne?.suma_sprzedanych_total || 0;
    const views = p.podsumowanie_globalne?.suma_wyswietlen_total || 0;
    totalSales += sales;
    totalViews += views;

    // Agreguj dane z ostatnich 30 dni
    const summary30 = p.summary_last_30_days;
    if (summary30) {
      totalRevenue += summary30.total_revenue || 0;
      totalCommissionSuc += summary30.total_commission_suc || 0;
      totalCommissionFsf += summary30.total_commission_fsf || 0;
      totalProfit += summary30.total_profit || 0;
      totalTransactions += summary30.transaction_count || 0;
      totalSoldQuantity30Days += summary30.total_sold_quantity || 0;
    }
  });

  // Debug log
  console.log('KPI Debug:', { totalSales, totalViews, productCount: products.length });

  const avgConversion = totalViews > 0
    ? (totalSales / totalViews) * 100
    : 0;

  console.log('Avg Conversion:', avgConversion);

  // Znajdz top produkt (z minimalną liczba wyswietlen)
  const eligibleProducts = products.filter(
    p => p.podsumowanie_globalne?.suma_wyswietlen_total >= CONFIG.MIN_VIEWS_FOR_TOP_PRODUCT
  );

  const topProduct = eligibleProducts.length > 0
    ? eligibleProducts.reduce((top, current) => {
        const topSales = top.podsumowanie_globalne?.suma_sprzedanych_total || 0;
        const currentSales = current.podsumowanie_globalne?.suma_sprzedanych_total || 0;
        return currentSales > topSales ? current : top;
      })
    : products[0] || null;

  // Globalny zysk/transakcja
  const globalZNT = totalTransactions > 0 ? totalProfit / totalTransactions : 0;

  // Globalny zysk/wyswietlenie
   const globalZNV = totalViews > 0 ? totalProfit / totalViews : 0;


  // Globalny drenaz prowizyjny
  const totalCommissions = Math.abs(totalCommissionSuc) + Math.abs(totalCommissionFsf);
  const globalDrainage = totalRevenue > 0 ? (totalCommissions / totalRevenue) * 100 : 0;

  return {
    totalSales,
    totalViews,
    avgConversion,
    topProduct,
    productCount: products.length,
    marketCount: Object.keys(markets).length,
    // Nowe KPI z ostatnich 30 dni
    totalRevenue,
    totalCommissionSuc,
    totalCommissionFsf,
    totalProfit,
    totalTransactions,
    totalSoldQuantity30Days,
    globalZNT,
    globalZNV,
    globalDrainage,
  };
}

/**
 * Zwraca top N produktow po sprzedazy
 */
function getTopProducts(products, count = 5) {
  return [...products]
    .sort((a, b) => {
      const salesA = a.podsumowanie_globalne?.suma_sprzedanych_total || 0;
      const salesB = b.podsumowanie_globalne?.suma_sprzedanych_total || 0;
      return salesB - salesA;
    })
    .slice(0, count);
}

/**
 * Klasyfikuje rynek
 */
function classifyMarket(sales, conversion) {
  if (conversion > 0.5 && sales > 50) {
    return { status: 'MOCNY', color: '#10b981', icon: '🟢' };
  } else if (conversion < 0.1 || sales < 10) {
    return { status: 'TESTOWY', color: '#f59e0b', icon: '🧪' };
  } else {
    return { status: 'SREDNI', color: '#3b82f6', icon: '🔵' };
  }
}

/**
 * Sortuje produkty
 */
function sortProducts(products, field, direction = 'desc') {
  return [...products].sort((a, b) => {
    let valueA, valueB;

    switch (field) {
      case 'sales':
        valueA = a.podsumowanie_globalne?.suma_sprzedanych_total || 0;
        valueB = b.podsumowanie_globalne?.suma_sprzedanych_total || 0;
        break;
      case 'views':
        valueA = a.podsumowanie_globalne?.suma_wyswietlen_total || 0;
        valueB = b.podsumowanie_globalne?.suma_wyswietlen_total || 0;
        break;
      case 'conversion':
        valueA = a.podsumowanie_globalne?.suma_wyswietlen_total > 0
          ? a.podsumowanie_globalne.suma_sprzedanych_total / a.podsumowanie_globalne.suma_wyswietlen_total
          : 0;
        valueB = b.podsumowanie_globalne?.suma_wyswietlen_total > 0
          ? b.podsumowanie_globalne.suma_sprzedanych_total / b.podsumowanie_globalne.suma_wyswietlen_total
          : 0;
        break;
      case 'znv':
        // Zysk netto / wyswietlenia
        const viewsA_znv = a.podsumowanie_globalne?.suma_wyswietlen_total || 0;
        const viewsB_znv = b.podsumowanie_globalne?.suma_wyswietlen_total || 0;
        const profitA_znv = a.summary_last_30_days?.total_profit || 0;
        const profitB_znv = b.summary_last_30_days?.total_profit || 0;
        valueA = viewsA_znv > 0 ? profitA_znv / viewsA_znv : 0;
        valueB = viewsB_znv > 0 ? profitB_znv / viewsB_znv : 0;
        break;
      case 'znt':
        // Zysk netto / transakcje
        const transA = a.summary_last_30_days?.transaction_count || 0;
        const transB = b.summary_last_30_days?.transaction_count || 0;
        const profitA_znt = a.summary_last_30_days?.total_profit || 0;
        const profitB_znt = b.summary_last_30_days?.total_profit || 0;
        valueA = transA > 0 ? profitA_znt / transA : 0;
        valueB = transB > 0 ? profitB_znt / transB : 0;
        break;
      case 'stock':
        valueA = a.podsumowanie_globalne?.stan_magazynowy_wspolny ?? 0;
        valueB = b.podsumowanie_globalne?.stan_magazynowy_wspolny ?? 0;
        break;
      case 'name':
        valueA = a.sygnatura || '';
        valueB = b.sygnatura || '';
        return direction === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      default:
        valueA = a.podsumowanie_globalne?.suma_sprzedanych_total || 0;
        valueB = b.podsumowanie_globalne?.suma_sprzedanych_total || 0;
    }

    return direction === 'asc' ? valueA - valueB : valueB - valueA;
  });
}

/**
 * Filtruje produkty
 */
function filterProducts(products, filters = {}) {
  return products.filter(product => {
    // Filtr tekstowy (sygnatura lub nazwa)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchSygnatura = product.sygnatura?.toLowerCase().includes(searchLower);
      const matchName = product.product_name?.toLowerCase().includes(searchLower);
      if (!matchSygnatura && !matchName) return false;
    }

    // Filtr po rynku
    if (filters.market && filters.market !== 'all') {
      const hasMarket = product.podsumowanie_per_rynek?.[filters.market];
      if (!hasMarket) return false;
    }

    // Filtr po konwersji
    if (filters.conversionStatus) {
      const views = product.podsumowanie_globalne?.suma_wyswietlen_total || 0;
      const sales = product.podsumowanie_globalne?.suma_sprzedanych_total || 0;
      const conversion = views > 0 ? (sales / views) * 100 : 0;

      if (filters.conversionStatus === 'high' && conversion < CONFIG.CONVERSION_THRESHOLDS.HIGH) {
        return false;
      }
      if (filters.conversionStatus === 'low' && conversion >= CONFIG.CONVERSION_THRESHOLDS.MEDIUM) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Znajduje najlepszy rynek dla produktu
 */
function getBestMarket(product) {
  const markets = product.podsumowanie_per_rynek || {};
  let bestMarket = null;
  let maxSales = -1;

  Object.entries(markets).forEach(([marketId, data]) => {
    if (data.suma_sprzedanych > maxSales) {
      maxSales = data.suma_sprzedanych;
      bestMarket = {
        id: marketId,
        ...CONFIG.MARKETS[marketId],
        sales: data.suma_sprzedanych,
      };
    }
  });

  return bestMarket;
}

/**
 * Oblicza konwersje produktu
 */
function getProductConversion(product) {
  const views = product.podsumowanie_globalne?.suma_wyswietlen_total || 0;
  const sales = product.podsumowanie_globalne?.suma_sprzedanych_total || 0;
  return views > 0 ? (sales / views) * 100 : 0;
}

/**
 * Zwraca status konwersji
 */
function getConversionStatus(conversion) {
  if (conversion >= CONFIG.CONVERSION_THRESHOLDS.HIGH) {
    return { class: 'high', color: 'var(--success)', label: 'Wysoka' };
  } else if (conversion >= CONFIG.CONVERSION_THRESHOLDS.MEDIUM) {
    return { class: 'medium', color: 'var(--warning)', label: 'Srednia' };
  } else {
    return { class: 'low', color: 'var(--danger)', label: 'Niska' };
  }
}

/**
 * Aktualizuje nazwe produktu przez webhook do n8n
 * @param {string} sygnatura - Sygnatura produktu
 * @param {string} newName - Nowa nazwa produktu
 * @returns {Promise<boolean>} - true jesli sukces, false jesli blad
 */
async function updateProductName(sygnatura, newName) {
  try {
    const response = await fetch(CONFIG.WEBHOOK_UPDATE_PRODUCT_NAME, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sygnatura: sygnatura,
        newName: newName,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Aktualizuj nazwe w lokalnych danych
    const product = processedData.products.find(p => p.sygnatura === sygnatura);
    if (product) {
      product.product_name = newName;
    }

    return true;
  } catch (error) {
    console.error('Blad aktualizacji nazwy produktu:', error);
    return false;
  }
}

/**
 * Formatuje liczbe z separatorami
 */
function formatNumber(num) {
  return num.toLocaleString('pl-PL');
}

/**
 * Formatuje procent
 */
function formatPercent(num, decimals = 2) {
  return num.toFixed(decimals) + '%';
}

// ============================================
// KLASYFIKACJA PRODUKTOW (SKALUJ/OPTYMALIZUJ/WYGAS)
// ============================================

/**
 * Oblicza srednie wartosci dla calego portfolio
 * Potrzebne do klasyfikacji produktow
 */
function calculateAverages(products) {
  let totalZNV = 0;
  let totalZNT = 0;
  let totalConversion = 0;
  let countZNV = 0;
  let countZNT = 0;
  let countConversion = 0;
  const allViews = [];

  products.forEach(p => {
    const views = p.podsumowanie_globalne?.suma_wyswietlen_total || 0;
    const sales = p.podsumowanie_globalne?.suma_sprzedanych_total || 0;
    const profit = p.summary_last_30_days?.total_profit || 0;
    const transactions = p.summary_last_30_days?.transaction_count || 0;

    // ZNV (zysk/wyswietlenia)
    if (views > 0) {
      totalZNV += profit / views;
      countZNV++;
      allViews.push(views);
    }

    // ZNT (zysk/transakcje)
    if (transactions > 0) {
      totalZNT += profit / transactions;
      countZNT++;
    }

    // Konwersja
    if (views > 0) {
      totalConversion += (sales / views) * 100;
      countConversion++;
    }
  });

  // Oblicz percentyl wyswietlen
  allViews.sort((a, b) => a - b);
  const percentileIndex = Math.floor(allViews.length * (CONFIG.PRODUCT_STATUS.OPTIMIZE.VIEWS_PERCENTILE / 100));
  const viewsPercentile = allViews[percentileIndex] || CONFIG.PRODUCT_STATUS.OPTIMIZE.VIEWS_FIXED;

  return {
    avgZNV: countZNV > 0 ? totalZNV / countZNV : 0,
    avgZNT: countZNT > 0 ? totalZNT / countZNT : 0,
    avgConversion: countConversion > 0 ? totalConversion / countConversion : 0,
    viewsPercentile,
  };
}

/**
 * Oblicza drenaz prowizyjny produktu
 * drenaz = |prowizja_SUC + prowizja_FSF| / przychod
 */
function calculateDrainage(product) {
  const summary = product.summary_last_30_days;
  if (!summary || !summary.total_revenue || summary.total_revenue === 0) {
    return 0;
  }

  const totalCommission = Math.abs(summary.total_commission_suc || 0) + Math.abs(summary.total_commission_fsf || 0);
  return totalCommission / summary.total_revenue;
}

/**
 * Pobiera metryki produktu potrzebne do klasyfikacji
 */
function getProductMetrics(product) {
  const views = product.podsumowanie_globalne?.suma_wyswietlen_total || 0;
  const sales = product.podsumowanie_globalne?.suma_sprzedanych_total || 0;
  const profit = product.summary_last_30_days?.total_profit || 0;
  const transactions = product.summary_last_30_days?.transaction_count || 0;

  return {
    views,
    sales,
    profit,
    transactions,
    znv: views > 0 ? profit / views : 0,
    znt: transactions > 0 ? profit / transactions : 0,
    conversion: views > 0 ? (sales / views) * 100 : 0,
    drainage: calculateDrainage(product),
  };
}

/**
 * Klasyfikuje produkt: SCALE | OPTIMIZE | PHASE_OUT | null
 * Zwraca obiekt z statusem i powodem
 */
function classifyProduct(product, averages) {
  const metrics = getProductMetrics(product);
  const cfg = CONFIG.PRODUCT_STATUS;

  // === SKALUJ ===
  // Wszystkie warunki musza byc spelnione
  const scaleConditions = {
    highZNV: metrics.znv >= averages.avgZNV * cfg.SCALE.ZNV_MULTIPLIER,
    stableConversion: metrics.conversion >= averages.avgConversion * cfg.SCALE.CONVERSION_MULTIPLIER,
    minViews: metrics.views >= cfg.SCALE.MIN_VIEWS,
    minTransactions: metrics.transactions >= cfg.SCALE.MIN_TRANSACTIONS,
  };

  if (scaleConditions.highZNV && scaleConditions.stableConversion &&
      scaleConditions.minViews && scaleConditions.minTransactions) {
    return {
      status: 'SCALE',
      metrics,
      reason: 'Wysoki zysk/wyswietlenie i stabilna konwersja',
    };
  }

  // === WYGAS ===
  // Minimum 2 z 3 warunkow
  const phaseOutConditions = {
    lowZNV: metrics.znv < averages.avgZNV * cfg.PHASE_OUT.ZNV_MULTIPLIER,
    highDrainage: metrics.drainage >= cfg.PHASE_OUT.DRAINAGE_THRESHOLD,
    reliableData: metrics.views >= cfg.PHASE_OUT.MIN_VIEWS,
  };

  const phaseOutCount = Object.values(phaseOutConditions).filter(Boolean).length;
  if (phaseOutCount >= cfg.PHASE_OUT.MIN_CONDITIONS) {
    return {
      status: 'PHASE_OUT',
      metrics,
      reason: 'Niski zysk lub wysoki drenaz prowizyjny',
    };
  }

  // === OPTYMALIZUJ ===
  // Wszystkie warunki musza byc spelnione
  const optimizeConditions = {
    highViews: metrics.views >= averages.viewsPercentile || metrics.views >= cfg.OPTIMIZE.VIEWS_FIXED,
    lowZNT: metrics.znt < averages.avgZNT * cfg.OPTIMIZE.ZNT_MULTIPLIER,
    notBadConversion: metrics.conversion >= averages.avgConversion * cfg.OPTIMIZE.CONVERSION_MULTIPLIER,
  };

  if (optimizeConditions.highViews && optimizeConditions.lowZNT && optimizeConditions.notBadConversion) {
    return {
      status: 'OPTIMIZE',
      metrics,
      reason: 'Duzo ruchu, ale niski zysk na transakcji',
    };
  }

  // Brak klasyfikacji
  return null;
}

/**
 * Klasyfikuje wszystkie produkty i zwraca pogrupowane listy
 */
function classifyAllProducts(products) {
  const averages = calculateAverages(products);

  const classified = {
    scale: [],      // Do skalowania
    optimize: [],   // Do optymalizacji
    phaseOut: [],   // Do wygaszenia
    averages,       // Srednie dla referencji
  };

  products.forEach(product => {
    const classification = classifyProduct(product, averages);
    if (classification) {
      product._classification = classification;

      switch (classification.status) {
        case 'SCALE':
          classified.scale.push(product);
          break;
        case 'OPTIMIZE':
          classified.optimize.push(product);
          break;
        case 'PHASE_OUT':
          classified.phaseOut.push(product);
          break;
      }
    }
  });

  // Sortuj listy - najwazniejsze produkty na gorze
  // SCALE: po ZNV malejaco (najlepszy zysk/wyswietlenie)
  classified.scale.sort((a, b) => {
    const znvA = a._classification?.metrics?.znv || 0;
    const znvB = b._classification?.metrics?.znv || 0;
    return znvB - znvA;
  });

  // OPTIMIZE: po wyswietleniach malejaco (najwiekszy potencjal)
  classified.optimize.sort((a, b) => {
    const viewsA = a._classification?.metrics?.views || 0;
    const viewsB = b._classification?.metrics?.views || 0;
    return viewsB - viewsA;
  });

  // PHASE_OUT: po drenazu malejaco (najgorsze najpierw)
  classified.phaseOut.sort((a, b) => {
    const drainA = a._classification?.metrics?.drainage || 0;
    const drainB = b._classification?.metrics?.drainage || 0;
    return drainB - drainA;
  });

  // Ogranicz do max produktow per karta
  const maxPerCard = CONFIG.PRODUCT_STATUS.MAX_PRODUCTS_PER_CARD;
  classified.scale = classified.scale.slice(0, maxPerCard);
  classified.optimize = classified.optimize.slice(0, maxPerCard);
  classified.phaseOut = classified.phaseOut.slice(0, maxPerCard);

  return classified;
}
