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

  // Top produkty
  const topProducts = getTopProducts(products, CONFIG.TOP_PRODUCTS_COUNT);

  return {
    products,
    markets,
    kpis,
    topProducts,
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
