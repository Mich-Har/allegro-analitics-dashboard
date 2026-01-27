/* ===========================================
   ALLEGRO ANALYTICS DASHBOARD - RENDER
   Renderowanie komponentow UI
   =========================================== */

/**
 * Renderuje caly dashboard
 */
function renderDashboard(data) {
  renderHeader();
  renderProductStatusCards(data.classifiedProducts);
  renderGlobalSummary(data.kpis);
  renderProductsTable(data.products);
}

/**
 * Renderuje header
 */
function renderHeader() {
  const header = document.getElementById('header');
  const now = new Date();
  const formattedDate = now.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  header.innerHTML = `
    <div class="header-content">
      <div class="header-left">
        <div class="logo">
          <div class="logo-icon animate-pulse">📊</div>
          <h1 class="logo-text title-gradient">Allegro Analytics</h1>
        </div>
      </div>
      <div class="header-right">
        <span class="header-meta">Ostatnia aktualizacja: ${formattedDate}</span>
        <button id="refreshBtn" class="btn btn-primary">
          <span class="icon refresh-icon">🔄</span>
          <span class="btn-text">Odswiez dane</span>
        </button>
      </div>
    </div>
  `;
}

/**
 * Renderuje globalne podsumowanie (dwa wiersze)
 */
function renderGlobalSummary(kpis) {
  const container = document.getElementById('globalSummary');

  const profitClass = kpis.totalProfit > 0 ? 'profit' : 'loss';
  const profitColor = kpis.totalProfit > 0 ? 'var(--success)' : 'var(--danger)';
  const drainageColor = kpis.globalDrainage > 25 ? 'var(--danger)' : kpis.globalDrainage > 15 ? 'var(--warning)' : 'var(--text-primary)';

  container.innerHTML = `
    <div class="global-summary-card animate-fadeIn">
      <div class="global-summary-header">
        <h2 class="global-summary-title">📊 Podsumowanie globalne</h2>
        <span class="global-summary-period">Ostatnie 30 dni</span>
      </div>

      <!-- Wiersz 1: Metryki wydajnosci -->
      <div class="global-summary-row">
        <div class="global-summary-section">
          <div class="global-summary-label">Transakcje/Sprzedaz(szt.)</div>
          <div class="global-summary-value">${kpis.totalTransactions} / ${kpis.totalSoldQuantity30Days}</div>
        </div>
        <div class="global-summary-section">
          <div class="global-summary-label">Wyswietlenia</div>
          <div class="global-summary-value">${formatNumber(kpis.totalViews)}</div>
        </div>
        <div class="global-summary-section">
          <div class="global-summary-label">Konwersja</div>
          <div class="global-summary-value">${formatPercent(kpis.avgConversion)}</div>
        </div>
        <div class="global-summary-section">
          <div class="global-summary-label">Drenaz</div>
          <div class="global-summary-value" style="color: ${drainageColor};">${kpis.globalDrainage.toFixed(1)}%</div>
        </div>
        <div class="global-summary-section">
          <div class="global-summary-label">Zysk/Transakcja</div>
          <div class="global-summary-value">${formatCurrency(kpis.globalZNT)}</div>
        </div>
      </div>

      <!-- Wiersz 2: Finanse -->
      <div class="global-summary-row">
        <div class="global-summary-section">
          <div class="global-summary-label">Przychod</div>
          <div class="global-summary-value">${formatCurrency(kpis.totalRevenue)}</div>
        </div>
        <div class="global-summary-section">
          <div class="global-summary-label">Prowizja SUC</div>
          <div class="global-summary-value" style="color: var(--warning);">${formatCurrency(kpis.totalCommissionSuc)}</div>
        </div>
        <div class="global-summary-section">
          <div class="global-summary-label">Prowizja FSF</div>
          <div class="global-summary-value" style="color: var(--info);">${formatCurrency(kpis.totalCommissionFsf)}</div>
        </div>
        <div class="global-summary-section global-summary-profit ${profitClass}">
          <div class="global-summary-label">Zysk netto</div>
          <div class="global-summary-value" style="color: ${profitColor};">${formatCurrency(kpis.totalProfit)}</div>
        </div>
      </div>

      <!-- Linia oddzielajaca i wyjasnienia -->
      <div class="global-summary-legend">
        <div class="global-summary-legend-item"><strong>Transakcje</strong> - Liczba zamowien zlozonych przez klientow</div>
        <div class="global-summary-legend-item"><strong>Sprzedaz (szt.)</strong> - Laczna liczba sprzedanych sztuk produktow</div>
        <div class="global-summary-legend-item"><strong>Konwersja</strong> - Procent wyswietlen, ktore zakonczyly sie zakupem</div>
        <div class="global-summary-legend-item"><strong>Drenaz</strong> - Procent przychodu pochlanianego przez prowizje Allegro</div>
        <div class="global-summary-legend-item"><strong>Zysk/Transakcja</strong> - Sredni zysk netto z jednego zamowienia</div>
        <div class="global-summary-legend-item"><strong>Przychod</strong> - Calkowita wartosc sprzedazy przed potraconymi prowizjami</div>
        <div class="global-summary-legend-item"><strong>Prowizja SUC</strong> - Prowizja od sprzedazy (Success Fee)</div>
        <div class="global-summary-legend-item"><strong>Prowizja FSF</strong> - Prowizja od sprzedazy oferty wyrosnionej (Fulfillment Service Fee)</div>
        <div class="global-summary-legend-item"><strong>Zysk netto</strong> - Przychod po odjeciu wszystkich prowizji Allegro</div>
      </div>
    </div>
  `;
}

/**
 * Renderuje karty statusow produktow (SKALUJ/OPTYMALIZUJ/WYGAS)
 */
function renderProductStatusCards(classifiedProducts) {
  const container = document.getElementById('topProductsSection');

  if (!classifiedProducts) {
    container.innerHTML = '';
    return;
  }

  const { scale, optimize, phaseOut } = classifiedProducts;

  // Helper do renderowania listy produktow w karcie
  const renderProductList = (products, type) => {
    if (!products || products.length === 0) {
      return '<div class="status-empty">Brak produktow w tej kategorii</div>';
    }

    return products.map((product, index) => {
      const metrics = product._classification?.metrics || {};
      const name = truncateText(product.product_name || product.sygnatura, 40);

      let metricHtml = '';
      switch (type) {
        case 'scale':
          metricHtml = `
            <span class="status-metric">ZNT: ${formatCurrency(metrics.znt)}</span>
            <span class="status-metric">${metrics.transactions} trans.</span>
          `;
          break;
        case 'optimize':
          metricHtml = `
            <span class="status-metric">ZNT: ${formatCurrency(metrics.znt)}</span>
            <span class="status-metric">${formatNumber(metrics.views)} wys.</span>
          `;
          break;
        case 'phaseOut':
          metricHtml = `
            <span class="status-metric">Drenaz: ${(metrics.drainage * 100).toFixed(1)}%</span>
            <span class="status-metric">ZNT: ${formatCurrency(metrics.znt)}</span>
          `;
          break;
      }

      return `
        <div class="status-item" data-sygnatura="${product.sygnatura}" style="animation-delay: ${index * 50}ms">
          <div class="status-item-name">${name}</div>
          <div class="status-item-metrics">${metricHtml}</div>
        </div>
      `;
    }).join('');
  };

  container.innerHTML = `
    <div class="status-cards-container animate-fadeIn">
      <!-- SKALUJ -->
      <div class="status-card status-card-scale">
        <div class="status-card-header">
          <span class="status-card-icon">🚀</span>
          <span class="status-card-title">Do skalowania</span>
          <span class="status-card-count">${scale.length}</span>
        </div>
        <div class="status-card-description">
          Wysoki zysk/transakcje i stabilna konwersja. Doloz budzet i promuj.
        </div>
        <div class="status-card-list">
          ${renderProductList(scale, 'scale')}
        </div>
      </div>

      <!-- OPTYMALIZUJ -->
      <div class="status-card status-card-optimize">
        <div class="status-card-header">
          <span class="status-card-icon">⚙️</span>
          <span class="status-card-title">Do optymalizacji</span>
          <span class="status-card-count">${optimize.length}</span>
        </div>
        <div class="status-card-description">
          Duzo ruchu, ale niski zysk/transakcja. Popraw cene, opis lub zdjecia.
        </div>
        <div class="status-card-list">
          ${renderProductList(optimize, 'optimize')}
        </div>
      </div>

      <!-- WYGAS -->
      <div class="status-card status-card-phaseout">
        <div class="status-card-header">
          <span class="status-card-icon">⏸️</span>
          <span class="status-card-title">Do wygaszenia</span>
          <span class="status-card-count">${phaseOut.length}</span>
        </div>
        <div class="status-card-description">
          Niski zysk lub wysoki drenaz prowizyjny. Uwolnij budzet i uwage.
        </div>
        <div class="status-card-list">
          ${renderProductList(phaseOut, 'phaseOut')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Formatuje wartosc KPI
 */
function formatKPIValue(value, format) {
  switch (format) {
    case 'number':
      return formatNumber(value);
    case 'percent':
      return formatPercent(value);
    case 'text':
    default:
      return value;
  }
}

/**
 * Animuje liczby w KPI
 */
function animateKPINumbers() {
  document.querySelectorAll('.kpi-value[data-format="number"]').forEach(el => {
    const targetValue = parseFloat(el.dataset.value) || 0;
    animateValue(el, 0, targetValue, CONFIG.ANIMATION.COUNT_DURATION);
  });

  document.querySelectorAll('.kpi-value[data-format="percent"]').forEach(el => {
    const targetValue = parseFloat(el.dataset.value) || 0;
    animateValue(el, 0, targetValue, CONFIG.ANIMATION.COUNT_DURATION, true);
  });
}

/**
 * Animuje pojedyncza wartosc
 */
function animateValue(element, start, end, duration, isPercent = false) {
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * easeOut;

    element.textContent = isPercent
      ? formatPercent(current)
      : formatNumber(Math.floor(current));

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Renderuje sekcje wykresow
 */
function renderCharts(topProducts, markets) {
  // Bar chart - top produkty (minimalistyczny styl)
  const barContainer = document.getElementById('barChart');
  const barChartData = prepareBarChartData(topProducts);
  renderBarChart(barContainer, barChartData, {
    width: 700,
    height: Math.max(150, topProducts.length * 32 + 20),
    labelWidth: 220,
    barHeight: 18,
    fontSize: 12,
    animated: true,
  });
}

/**
 * Renderuje tabele produktow
 */
function renderProductsTable(products, sortField = 'sales', sortDir = 'desc', searchQuery = '') {
  const container = document.getElementById('productsTable');

  // Filtruj produkty po wyszukiwaniu
  let filteredProducts = searchQuery
    ? products.filter(p => {
        const query = searchQuery.toLowerCase();
        const matchName = (p.product_name || '').toLowerCase().includes(query);
        const matchSignature = (p.sygnatura || '').toLowerCase().includes(query);
        return matchName || matchSignature;
      })
    : products;

  // Aktualizuj licznik produktow w naglowku
  const tableTitle = document.querySelector('.table-title');
  if (tableTitle) {
    tableTitle.textContent = `📦 Produkty (${filteredProducts.length})`;
  }

  const sortedProducts = sortProducts(filteredProducts, sortField, sortDir);

  const maxSales = Math.max(...products.map(p => p.podsumowanie_globalne?.suma_sprzedanych_total || 0));
  const maxViews = Math.max(...products.map(p => p.podsumowanie_globalne?.suma_wyswietlen_total || 0));

  container.innerHTML = `
    <table class="products-table">
      <thead>
        <tr>
          <th data-sort="name" class="${sortField === 'name' ? 'sorted' : ''}">
            Produkt <span class="sort-icon">${getSortIcon('name', sortField, sortDir)}</span>
          </th>
          <th data-sort="views" class="${sortField === 'views' ? 'sorted' : ''}">
            Wyświetlenia <span class="sort-icon">${getSortIcon('views', sortField, sortDir)}</span>
          </th>
          <th data-sort="sales" class="${sortField === 'sales' ? 'sorted' : ''}">
            Sprzedaz <span class="sort-icon">${getSortIcon('sales', sortField, sortDir)}</span>
          </th>
          <th data-sort="conversion" class="${sortField === 'conversion' ? 'sorted' : ''}">
            Konwersja <span class="sort-icon">${getSortIcon('conversion', sortField, sortDir)}</span>
          </th>
          <th data-sort="znt" class="${sortField === 'znt' ? 'sorted' : ''}">
            Zysk/Transakcja <span class="sort-icon">${getSortIcon('znt', sortField, sortDir)}</span>
          </th>
          <th data-sort="stock" class="${sortField === 'stock' ? 'sorted' : ''}">
            Magazyn <span class="sort-icon">${getSortIcon('stock', sortField, sortDir)}</span>
          </th>
          <th>Aukcje</th>
        </tr>
      </thead>
      <tbody>
        ${sortedProducts.map((product, index) => renderProductRow(product, index, maxSales, maxViews)).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Pobiera unikalne aukcje z produktu (deduplikacja po ID)
 * Aukcje sa duplikowane na roznych rynkach, wiec trzeba je zdeduplikowac
 */
function getUniqueAuctions(product) {
  const auctions = product.aukcje_szczegolowo || {};
  const auctionsMap = new Map();

  // Iteruj przez wszystkie rynki i zbierz unikalne aukcje po ID
  Object.values(auctions).forEach(marketAuctions => {
    marketAuctions.forEach(auction => {
      if (!auctionsMap.has(auction.id)) {
        auctionsMap.set(auction.id, auction);
      }
    });
  });

  return Array.from(auctionsMap.values());
}

/**
 * Renderuje wiersz produktu
 */
function renderProductRow(product, index, maxSales, maxViews) {
  const stock = product.podsumowanie_globalne?.stan_magazynowy_wspolny ?? '-';
  const stockClass = typeof stock === 'number' && stock < 10 ? 'text-danger' : '';

  // Pobierz unikalne aukcje (zdeduplikowane po ID)
  const uniqueAuctions = getUniqueAuctions(product);
  const activeAuctions = uniqueAuctions.filter(a => a.status === 'ACTIVE');
  const endedAuctions = uniqueAuctions.filter(a => a.status !== 'ACTIVE');
  const activeAuctionsCount = activeAuctions.length;
  const endedAuctionsCount = endedAuctions.length;
  const hasActiveAuctions = activeAuctionsCount > 0;

  // Oblicz metryki tylko z aktywnych aukcji (unikalne)
  const activeViews = activeAuctions.reduce((sum, a) => sum + (a.wyswietlen || 0), 0);
  const activeSales = activeAuctions.reduce((sum, a) => sum + (a.sprzedanych || 0), 0);
  const activeConversion = activeViews > 0 ? (activeSales / activeViews) * 100 : 0;
  const conversionStatus = getConversionStatus(activeConversion);

  // Oblicz ZNT z danych 30-dniowych
  const summary30 = product.summary_last_30_days;
  const profit30 = summary30?.total_profit || 0;
  const transactions30 = summary30?.transaction_count || 0;

  const znt = transactions30 > 0 ? profit30 / transactions30 : 0;
  const profitColor = profit30 >= 0 ? 'var(--success)' : 'var(--danger)';

  const inactiveClass = !hasActiveAuctions ? 'product-inactive' : '';
  const conversionBadgeClass = !hasActiveAuctions ? 'badge-neutral' :
    (conversionStatus.class === 'high' ? 'badge-success' : conversionStatus.class === 'medium' ? 'badge-warning' : 'badge-danger');

  return `
    <tr class="product-row ${inactiveClass}" data-sygnatura="${product.sygnatura}" data-index="${index}">
      <td>
        <div class="product-cell">
          <div class="product-name-row">
            <span class="product-name tooltip" data-tooltip="${product.product_name || ''}" data-sygnatura="${product.sygnatura}">
              ${truncateText(product.product_name || '-', 60)}
            </span>
            <span class="edit-name-btn" data-sygnatura="${product.sygnatura}" data-current-name="${(product.product_name || '').replace(/"/g, '&quot;')}" title="Edytuj nazwe">✏️</span>
          </div>
          <span class="product-signature">${product.sygnatura}</span>
        </div>
      </td>
      <td style="text-align: right;">
        <span class="text-mono">${formatNumber(activeViews)}</span>
      </td>
      <td style="text-align: right;">
        <strong class="text-mono">${activeSales}</strong>
      </td>
      <td style="text-align: right;">
        <span class="badge ${conversionBadgeClass}">
          ${formatPercent(activeConversion)}
        </span>
      </td>
      <td style="text-align: right;">
        <span class="text-mono" style="color: ${profitColor};">${znt.toFixed(2)}</span>
      </td>
      <td style="text-align: right;">
        <span class="text-mono ${stockClass}">${typeof stock === 'number' ? stock : stock}</span>
      </td>
      <td style="text-align: center;">
        <span class="text-mono">
          <span style="color: var(--success);">${activeAuctionsCount}</span><span style="color: var(--text-muted);">/${endedAuctionsCount}</span>
        </span>
      </td>
    </tr>
    <tr class="expanded-content" id="expanded-${product.sygnatura}" style="display: none;">
      <td colspan="7">
        <div class="expanded-inner">
          ${renderProductDetails(product)}
        </div>
      </td>
    </tr>
  `;
}

/**
 * Renderuje szczegoly produktu (rozwijane)
 */
function renderProductDetails(product) {
  const markets = product.podsumowanie_per_rynek || {};
  const auctions = product.aukcje_szczegolowo || {};

  return `
    <!-- SEKCJA: Ostatnie 30 dni -->
    ${renderSummary30Days(product)}

    <!-- SEKCJA: Rynki -->
    <div class="markets-grid">
      ${Object.entries(markets).map(([marketId, marketData]) => {
        const marketAuctions = auctions[marketId] || [];
        const activeAuctions = marketAuctions.filter(a => a.status === 'ACTIVE');
        const activeCount = activeAuctions.length;

        // Oblicz wyswietlenia i konwersje tylko z aktywnych aukcji
        const activeViews = activeAuctions.reduce((sum, a) => sum + (a.wyswietlen || 0), 0);
        const activeSales = activeAuctions.reduce((sum, a) => sum + (a.sprzedanych || 0), 0);
        const activeConversion = activeViews > 0 ? (activeSales / activeViews) * 100 : 0;

        return `
        <div class="market-section" data-market="${marketId}">
          <div class="market-header-collapsible" data-market-toggle="${marketId}">
            <div class="market-info">
              <span class="market-expand-icon">▶</span>
              <span class="flag">${CONFIG.MARKETS[marketId]?.flag || ''}</span>
              <strong>${CONFIG.MARKETS[marketId]?.name || marketId}</strong>
              ${marketData.rynek_glowny ? '<span class="badge badge-neutral">glowny</span>' : ''}
            </div>
            <div class="market-stats">
              <span class="badge badge-success">${marketData.suma_sprzedanych} szt.</span>
              <span class="text-mono" style="font-size: 11px; margin-left: 6px; color: var(--warning);">
                ${formatNumber(activeViews)} wys.
              </span>
              <span class="text-mono" style="font-size: 11px; margin-left: 6px;">
                ${activeConversion.toFixed(2)}%
              </span>
              <span class="text-muted" style="font-size: 11px; margin-left: 6px;">
                (${activeCount} ${activeCount === 1 ? 'aktywna' : 'aktywnych'})
              </span>
            </div>
          </div>
          <div class="market-auctions-collapse" id="market-auctions-${product.sygnatura}-${marketId}" style="display: none;">
            ${renderGroupedAuctions(marketAuctions)}
          </div>
        </div>
      `}).join('')}
    </div>
  `;
}

/**
 * Renderuje pogrupowane aukcje (aktywne i zakonczone)
 */
function renderGroupedAuctions(auctionsList) {
  const activeAuctions = auctionsList.filter(a => a.status === 'ACTIVE');
  const endedAuctions = auctionsList.filter(a => a.status !== 'ACTIVE');

  // Oblicz statystyki dla aktywnych aukcji
  const activeViews = activeAuctions.reduce((sum, a) => sum + (a.wyswietlen || 0), 0);
  const activeSales = activeAuctions.reduce((sum, a) => sum + (a.sprzedanych || 0), 0);
  const activeConversion = activeViews > 0 ? (activeSales / activeViews) * 100 : 0;

  // Oblicz statystyki dla zakonczonych aukcji
  const endedViews = endedAuctions.reduce((sum, a) => sum + (a.wyswietlen || 0), 0);
  const endedSales = endedAuctions.reduce((sum, a) => sum + (a.sprzedanych || 0), 0);
  const endedConversion = endedViews > 0 ? (endedSales / endedViews) * 100 : 0;

  let html = '';

  if (activeAuctions.length > 0) {
    html += `
      <div class="auction-group">
        <div class="auction-group-header auction-group-toggle" style="font-size: 12px; font-weight: 600; color: var(--success); padding: 8px 12px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
          <span>
            <span class="auction-expand-icon" style="display: inline-block; width: 12px; margin-right: 6px; transition: transform 0.2s;">▶</span>
            Aktywne aukcje (${activeAuctions.length})
          </span>
          <span style="font-weight: 400; font-size: 11px; display: flex; gap: 12px;">
            <span>${formatNumber(activeViews)} wys.</span>
            <span>${activeSales} szt.</span>
            <span>${activeConversion.toFixed(2)}%</span>
          </span>
        </div>
        <div class="auction-list auction-list-collapse" style="display: none;">
          ${activeAuctions.map(auction => renderAuctionItem(auction)).join('')}
        </div>
      </div>
    `;
  }

  if (endedAuctions.length > 0) {
    html += `
      <div class="auction-group">
        <div class="auction-group-header auction-group-toggle" style="font-size: 12px; font-weight: 600; color: var(--text-muted); padding: 8px 12px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
          <span>
            <span class="auction-expand-icon" style="display: inline-block; width: 12px; margin-right: 6px; transition: transform 0.2s;">▶</span>
            Zakonczone aukcje (${endedAuctions.length})
          </span>
          <span style="font-weight: 400; font-size: 11px; display: flex; gap: 12px;">
            <span>${formatNumber(endedViews)} wys.</span>
            <span>${endedSales} szt.</span>
            <span>${endedConversion.toFixed(2)}%</span>
          </span>
        </div>
        <div class="auction-list auction-list-collapse" style="display: none;">
          ${endedAuctions.map(auction => renderAuctionItem(auction)).join('')}
        </div>
      </div>
    `;
  }

  if (auctionsList.length === 0) {
    html = '<div class="auction-list"><div class="text-muted" style="padding: 12px;">Brak aukcji</div></div>';
  }

  return html;
}

/**
 * Renderuje pojedyncza aukcje
 */
function renderAuctionItem(auction) {
  const statusBadge = auction.status === 'ACTIVE'
    ? '<span class="badge badge-success">AKTYWNA</span>'
    : '<span class="badge badge-neutral">ZAKONCZONA</span>';

  return `
    <div class="auction-item">
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span class="text-mono" style="color: var(--text-muted); font-size: 12px;">#${auction.id}</span>
          ${statusBadge}
        </div>
        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">
          ${truncateText(auction.nazwa, 60)}
        </div>
        <div style="display: flex; gap: 16px; font-size: 12px; color: var(--text-muted);">
          <span><strong>${auction.sprzedanych}</strong> sprzedanych</span>
          <span><strong>${formatNumber(auction.wyswietlen)}</strong> wyswietl.</span>
          <span><strong>${auction.cena} zl</strong></span>
        </div>
      </div>
      <a href="${auction.link}" target="_blank" rel="noopener noreferrer" class="link link-external" style="font-size: 12px;">
        Otworz
      </a>
    </div>
  `;
}

/**
 * Formatuje walute (PLN)
 */
function formatCurrency(value) {
  if (value === undefined || value === null) return '0.00 PLN';
  return value.toFixed(2) + ' PLN';
}

/**
 * Renderuje sekcje "Szczegoly sprzedazy" (zamiennik "Ostatnie 30 dni")
 */
function renderSummary30Days(product) {
  const summary = product.summary_last_30_days;
  const hasNoData = !summary || (summary.transaction_count === 0 && summary.total_sold_quantity === 0);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Koszty z danych produktu (jesli backend je zwraca w glownym jsonie)
  const costs = product.product_costs || null;

  // Przygotuj poczatkowe dane okresu z summary_last_30_days
  let initialPeriodHtml = '';
  if (hasNoData) {
    initialPeriodHtml = '<div class="empty-30-days">Brak sprzedazy w biezacym miesiacu</div>';
  } else {
    // Uzyj istniejacych danych summary_last_30_days jako poczatkowych
    const initialData = {
      ...summary,
      _sygnatura: product.sygnatura,
    };
    initialPeriodHtml = renderPeriodData(initialData, costs);
  }

  return `
    <div class="summary-30-days" data-sygnatura="${product.sygnatura}">
      <div class="summary-30-days-header" data-summary-toggle="${product.sygnatura}">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="summary-expand-icon">▶</span>
          <strong>Szczegoly sprzedazy</strong>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          ${hasNoData ? '' : `
            <span class="badge badge-success">${summary.total_sold_quantity} szt.</span>
            <span class="text-mono" style="color: var(--success);">
              ${formatCurrency(summary.total_profit)} zysku
            </span>
          `}
        </div>
      </div>
      <div class="summary-30-days-content" style="display: none;">
        ${renderPeriodSelector(product.sygnatura, null, currentYear, currentMonth)}
        <div class="product-costs-section" data-sygnatura="${product.sygnatura}">
          ${renderProductCostsView(product.sygnatura, costs)}
        </div>
        <div class="period-data-container" data-sygnatura="${product.sygnatura}">
          ${initialPeriodHtml}
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderuje selektor okresu (rok + miesiac)
 */
function renderPeriodSelector(sygnatura, availablePeriods, selectedYear, selectedMonth) {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Domyslnie lata: currentYear-2..currentYear
  const years = availablePeriods?.years || [currentYear - 2, currentYear - 1, currentYear];
  const monthsWithData = availablePeriods?.months_with_data || [];

  const monthNames = [
    'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien'
  ];

  const yearOptions = years.map(y =>
    `<option value="${y}" ${y === selectedYear ? 'selected' : ''}>${y}</option>`
  ).join('');

  const monthOptions = [`<option value="0" ${selectedMonth === 0 ? 'selected' : ''}>Caly rok</option>`]
    .concat(monthNames.map((name, i) => {
      const m = i + 1;
      const key = `${selectedYear}-${String(m).padStart(2, '0')}`;
      const disabled = monthsWithData.length > 0 && !monthsWithData.includes(key) ? 'disabled' : '';
      return `<option value="${m}" ${m === selectedMonth ? 'selected' : ''} ${disabled}>${name}</option>`;
    }))
    .join('');

  return `
    <div class="period-selector" data-sygnatura="${sygnatura}">
      <select class="period-select period-year-select" data-sygnatura="${sygnatura}" data-type="year">
        ${yearOptions}
      </select>
      <select class="period-select period-month-select" data-sygnatura="${sygnatura}" data-type="month">
        ${monthOptions}
      </select>
      <button class="btn btn-primary period-load-btn" data-sygnatura="${sygnatura}" style="padding: 4px 12px; font-size: 12px;">
        Zaladuj
      </button>
    </div>
  `;
}

/**
 * Renderuje sekcje kosztow produktu (tryb podgladu)
 */
function renderProductCostsView(sygnatura, costs) {
  const purchaseGross = costs?.purchase_price_gross;
  const vatRate = costs?.vat_rate ?? CONFIG.DEFAULT_VAT_RATE;
  const incomeTaxRate = costs?.income_tax_rate ?? CONFIG.DEFAULT_INCOME_TAX_RATE;
  const storageCost = costs?.storage_cost_per_unit;

  return `
    <div class="costs-header">
      <strong style="font-size: 11px; text-transform: uppercase; color: var(--text-muted);">Koszty produktu</strong>
      <button class="btn btn-ghost costs-edit-btn" data-sygnatura="${sygnatura}" style="padding: 2px 8px; font-size: 11px;">Edytuj</button>
    </div>
    <div class="costs-fields">
      <div class="costs-field">
        <span class="costs-field-label">Cena zakupu brutto</span>
        <span class="costs-field-value">${purchaseGross != null ? purchaseGross.toFixed(2) + ' zl' : 'BRAK'}</span>
      </div>
      <div class="costs-field">
        <span class="costs-field-label">Stawka VAT</span>
        <span class="costs-field-value">${vatRate}%</span>
      </div>
      <div class="costs-field">
        <span class="costs-field-label">Podatek dochodowy</span>
        <span class="costs-field-value">${incomeTaxRate}%</span>
      </div>
      <div class="costs-field">
        <span class="costs-field-label">Koszt magazynu/szt.</span>
        <span class="costs-field-value">${storageCost != null ? storageCost.toFixed(2) + ' zl' : 'BRAK'}</span>
      </div>
    </div>
  `;
}

/**
 * Renderuje sekcje kosztow produktu (tryb edycji)
 */
function renderProductCostsEdit(sygnatura, costs) {
  const purchaseGross = costs?.purchase_price_gross ?? '';
  const vatRate = costs?.vat_rate ?? CONFIG.DEFAULT_VAT_RATE;
  const incomeTaxRate = costs?.income_tax_rate ?? CONFIG.DEFAULT_INCOME_TAX_RATE;
  const storageCost = costs?.storage_cost_per_unit ?? '';

  return `
    <div class="costs-header">
      <strong style="font-size: 11px; text-transform: uppercase; color: var(--text-muted);">Koszty produktu</strong>
      <div style="display: flex; gap: 4px;">
        <button class="btn btn-primary costs-save-btn" data-sygnatura="${sygnatura}" style="padding: 2px 8px; font-size: 11px;">Zapisz</button>
        <button class="btn btn-ghost costs-cancel-btn" data-sygnatura="${sygnatura}" style="padding: 2px 8px; font-size: 11px;">Anuluj</button>
      </div>
    </div>
    <div class="costs-fields costs-edit-mode">
      <div class="costs-field">
        <span class="costs-field-label">Cena zakupu brutto</span>
        <div class="costs-field-input-wrap">
          <input type="number" step="0.01" class="costs-input" data-field="purchase_price_gross" value="${purchaseGross}" placeholder="0.00"> zl
        </div>
      </div>
      <div class="costs-field">
        <span class="costs-field-label">Stawka VAT</span>
        <div class="costs-field-input-wrap">
          <input type="number" step="1" class="costs-input" data-field="vat_rate" value="${vatRate}" placeholder="23"> %
        </div>
      </div>
      <div class="costs-field">
        <span class="costs-field-label">Podatek dochodowy</span>
        <div class="costs-field-input-wrap">
          <input type="number" step="1" class="costs-input" data-field="income_tax_rate" value="${incomeTaxRate}" placeholder="12"> %
        </div>
      </div>
      <div class="costs-field">
        <span class="costs-field-label">Koszt magazynu/szt.</span>
        <div class="costs-field-input-wrap">
          <input type="number" step="0.01" class="costs-input" data-field="storage_cost_per_unit" value="${storageCost}" placeholder="0.00"> zl
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderuje pelne dane okresu (metryki + per aukcja)
 */
function renderPeriodData(periodData, costs) {
  if (!periodData) {
    return '<div class="empty-30-days">Brak danych dla wybranego okresu</div>';
  }

  const summary = periodData;
  const hasNoData = summary.transaction_count === 0 && summary.total_sold_quantity === 0;

  if (hasNoData) {
    return '<div class="empty-30-days">Brak sprzedazy w wybranym okresie</div>';
  }

  const hasCosts = costs && costs.purchase_price_gross != null;

  // All metrics in grouped layout
  let html = renderGroupedMetrics(summary, hasCosts ? costs : null);

  // Per offer section
  html += renderOffersSectionExtended(summary.by_offer, summary._sygnatura || '', costs);

  return html;
}

/**
 * Renderuje wszystkie metryki w grupach tematycznych
 */
function renderGroupedMetrics(summary, costs) {
  const transactions = summary.transaction_count || 0;
  const qty = summary.total_sold_quantity || 0;
  const revenue = summary.total_revenue || 0;
  const suc = summary.total_commission_suc || 0;
  const fsf = summary.total_commission_fsf || 0;
  const profit = summary.total_profit || 0;
  const znt = transactions > 0 ? profit / transactions : 0;
  const profitColor = profit > 0 ? 'var(--success)' : 'var(--danger)';

  let html = '';

  // === GRUPA 1: Sprzedaz ===
  html += `
    <div class="metrics-group">
      <div class="metrics-group-label">Sprzedaz</div>
      <div class="metrics-group-grid">
        <div class="metric-card">
          <div class="metric-label">Trans. / Szt.</div>
          <div class="metric-value">${transactions} / ${qty}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Przychod brutto</div>
          <div class="metric-value">${formatCurrency(revenue)}</div>
        </div>
        <div class="metric-card commission">
          <div class="metric-label">Prowizja SUC</div>
          <div class="metric-value" style="color: var(--warning);">${formatCurrency(suc)}</div>
        </div>
        <div class="metric-card commission">
          <div class="metric-label">Prowizja FSF</div>
          <div class="metric-value" style="color: ${fsf < 0 ? 'var(--info)' : 'var(--text-muted)'};">${formatCurrency(fsf)}</div>
        </div>
        <div class="metric-card ${profit > 0 ? 'profit' : 'loss'}">
          <div class="metric-label">Zysk (po prowizjach)</div>
          <div class="metric-value" style="color: ${profitColor};">${formatCurrency(profit)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Zysk / Trans.</div>
          <div class="metric-value" style="color: ${profitColor};">${formatCurrency(znt)}</div>
        </div>
      </div>
    </div>
  `;

  // Jesli brak kosztow — koniec
  if (!costs || costs.purchase_price_gross == null) return html;

  const ext = calculateExtendedMetrics({
    qty,
    revenue,
    suc,
    fsf,
    purchase_gross: costs.purchase_price_gross,
    vat_rate: costs.vat_rate ?? CONFIG.DEFAULT_VAT_RATE,
    tax_rate: costs.income_tax_rate ?? CONFIG.DEFAULT_INCOME_TAX_RATE,
    storage_unit: costs.storage_cost_per_unit,
  });
  if (!ext) return html;

  const netProfitColor = ext.netProfit >= 0 ? 'var(--success)' : 'var(--danger)';
  const marginColor = ext.netMargin >= 0 ? 'var(--success)' : 'var(--danger)';

  // === GRUPA 2: VAT ===
  html += `
    <div class="metrics-group">
      <div class="metrics-group-label">VAT</div>
      <div class="metrics-group-grid">
        <div class="metric-card revenue">
          <div class="metric-label">VAT sprzedazowy</div>
          <div class="metric-value">${formatCurrency(ext.vatSales)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">VAT zakupowy</div>
          <div class="metric-value">${formatCurrency(ext.vatPurchase)}</div>
        </div>
        <div class="metric-card ${ext.vatToPay > 0 ? 'loss' : 'profit'}">
          <div class="metric-label">VAT do zaplaty</div>
          <div class="metric-value">${formatCurrency(ext.vatToPay)}</div>
        </div>
      </div>
    </div>
  `;

  // === GRUPA 3: Koszty ===
  html += `
    <div class="metrics-group">
      <div class="metrics-group-label">Koszty</div>
      <div class="metrics-group-grid">
        <div class="metric-card">
          <div class="metric-label">Sprzedaz netto</div>
          <div class="metric-value">${formatCurrency(ext.salesNet)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Zakup netto</div>
          <div class="metric-value">${formatCurrency(ext.purchaseNet)}</div>
        </div>
        <div class="metric-card commission">
          <div class="metric-label">Prowizja Allegro</div>
          <div class="metric-value" style="color: var(--warning);">${formatCurrency(ext.commissionTotal)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Koszt magazynowy</div>
          <div class="metric-value">${formatCurrency(ext.storageCost)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Podatek dochodowy</div>
          <div class="metric-value">${formatCurrency(ext.incomeTax)}</div>
        </div>
        <div class="metric-card commission">
          <div class="metric-label">Koszty calkowite</div>
          <div class="metric-value">${formatCurrency(ext.totalCosts)}</div>
        </div>
      </div>
    </div>
  `;

  // === GRUPA 4: Wynik ===
  html += `
    <div class="metrics-group metrics-group-result">
      <div class="metrics-group-label">Wynik</div>
      <div class="metrics-group-grid">
        <div class="metric-card ${ext.netProfit >= 0 ? 'profit' : 'loss'}">
          <div class="metric-label">Zysk netto</div>
          <div class="metric-value" style="color: ${netProfitColor};">${formatCurrency(ext.netProfit)}</div>
        </div>
        <div class="metric-card ${ext.netProfitPerUnit >= 0 ? 'profit' : 'loss'}">
          <div class="metric-label">Zysk netto / szt.</div>
          <div class="metric-value" style="color: ${netProfitColor};">${formatCurrency(ext.netProfitPerUnit)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Marza netto</div>
          <div class="metric-value" style="color: ${marginColor};">${ext.netMargin.toFixed(2)}%</div>
        </div>
      </div>
    </div>
  `;

  return html;
}

/**
 * Renderuje sekcje aukcji z transakcjami (zysk netto per transakcja)
 */
function renderOffersSectionExtended(byOffer, sygnatura, costs) {
  if (!byOffer || Object.keys(byOffer).length === 0) {
    return '';
  }

  const offersArray = Object.entries(byOffer)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.sold_quantity - a.sold_quantity);

  return `
    <div class="offers-section">
      <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">
        Per aukcja (${offersArray.length})
      </div>
      ${offersArray.map(offer => renderOfferSectionExtended(offer, sygnatura, costs)).join('')}
    </div>
  `;
}

/**
 * Renderuje pojedyncza aukcje — transakcje z zyskiem netto per wiersz
 */
function renderOfferSectionExtended(offer, sygnatura, costs) {
  const profitColor = offer.profit > 0 ? 'var(--success)' : 'var(--danger)';
  const transactionCount = offer.transactions?.length || 0;

  return `
    <div class="offer-section">
      <div class="offer-header" data-offer-toggle="${sygnatura}-${offer.id}">
        <div class="offer-header-left">
          <span class="offer-expand-icon">▶</span>
          <span class="offer-id">#${offer.id}</span>
          <span class="offer-name">${truncateText(offer.offer_name, 40)}</span>
          <span class="offer-trans">${transactionCount} / ${offer.sold_quantity}</span>
          ${offer.price ? `<span class="text-mono" style="font-size: 10px; color: var(--text-muted);">${offer.price.toFixed(2)} zl/szt</span>` : ''}
        </div>
        <div class="offer-header-right">
          <span class="offer-revenue">${formatCurrency(offer.revenue)}</span>
          <span class="offer-suc" style="color: var(--warning);">${formatCurrency(offer.commission_suc)}</span>
          <span class="offer-fsf" style="color: var(--info);">${formatCurrency(offer.commission_fsf)}</span>
          <span class="offer-profit" style="color: ${profitColor};">${formatCurrency(offer.profit)}</span>
        </div>
      </div>
      <div class="offer-content" style="display: none;">
        ${renderOfferTransactionsExtended(offer.transactions, costs)}
      </div>
    </div>
  `;
}

/**
 * Renderuje transakcje aukcji z dodatkowa kolumna "Zysk netto"
 */
function renderOfferTransactionsExtended(transactions, costs) {
  if (!transactions || transactions.length === 0) {
    return '<div class="text-muted" style="font-size: 12px; padding: 8px;">Brak transakcji</div>';
  }

  const hasCosts = costs && costs.purchase_price_gross != null;

  return `
    <div class="offer-transactions">
      <div class="transaction-row transaction-row-header">
        <div class="transaction-left">
          <span class="transaction-cell transaction-date">Data</span>
          <span class="transaction-cell transaction-qty">Ilosc</span>
          <span class="transaction-cell transaction-price">Cena</span>
        </div>
        <div class="transaction-right">
          <span class="transaction-cell transaction-suc">SUC</span>
          <span class="transaction-cell transaction-fsf">FSF</span>
          <span class="transaction-cell transaction-profit">Zysk</span>
          ${hasCosts ? '<span class="transaction-cell transaction-net-profit">Zysk netto</span>' : ''}
        </div>
      </div>
      ${transactions.map(t => renderTransactionItemExtended(t, costs)).join('')}
    </div>
  `;
}

/**
 * Renderuje pojedyncza transakcje z zyskiem netto
 */
function renderTransactionItemExtended(t, costs) {
  const profitColor = t.profit > 0 ? 'var(--success)' : 'var(--danger)';
  const hasCosts = costs && costs.purchase_price_gross != null;

  let netProfitHtml = '';
  if (hasCosts) {
    const ext = calculateExtendedMetrics({
      qty: t.quantity,
      revenue: t.total_price,
      suc: t.commission_suc,
      fsf: t.commission_fsf,
      purchase_gross: costs.purchase_price_gross,
      vat_rate: costs.vat_rate ?? CONFIG.DEFAULT_VAT_RATE,
      tax_rate: costs.income_tax_rate ?? CONFIG.DEFAULT_INCOME_TAX_RATE,
      storage_unit: costs.storage_cost_per_unit,
    });
    if (ext) {
      const npColor = ext.netProfit >= 0 ? 'var(--success)' : 'var(--danger)';
      netProfitHtml = `<span class="transaction-cell transaction-net-profit" style="color: ${npColor};">${formatCurrency(ext.netProfit)}</span>`;
    } else {
      netProfitHtml = '<span class="transaction-cell transaction-net-profit">-</span>';
    }
  }

  return `
    <div class="transaction-row">
      <div class="transaction-left">
        <span class="transaction-cell transaction-date">${t.date.split('T')[0]} ${t.time}</span>
        <span class="transaction-cell transaction-qty">${t.quantity} szt.</span>
        <span class="transaction-cell transaction-price">${formatCurrency(t.total_price)}</span>
      </div>
      <div class="transaction-right">
        <span class="transaction-cell transaction-suc" style="color: var(--warning);">${formatCurrency(t.commission_suc)}</span>
        <span class="transaction-cell transaction-fsf" style="color: var(--info);">${formatCurrency(t.commission_fsf)}</span>
        <span class="transaction-cell transaction-profit" style="color: ${profitColor};">${formatCurrency(t.profit)}</span>
        ${netProfitHtml}
      </div>
    </div>
  `;
}

/**
 * Renderuje metryki podsumowania 30 dni
 */
function renderSummaryMetrics(summary, product) {
  const transactions = summary.transaction_count || 0;
  const profit = summary.total_profit || 0;

  // ZNT = zysk netto / transakcje
  const znt = transactions > 0 ? profit / transactions : 0;

  const profitColor = profit > 0 ? 'var(--success)' : 'var(--danger)';

  return `
    <div class="summary-30-days-metrics">
      <div class="metric-card">
        <div class="metric-label">Trans./Szt.</div>
        <div class="metric-value">${transactions} / ${summary.total_sold_quantity}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Przychod</div>
        <div class="metric-value">${formatCurrency(summary.total_revenue)}</div>
      </div>
      <div class="metric-card commission">
        <div class="metric-label">SUC</div>
        <div class="metric-value" style="color: var(--warning);">${formatCurrency(summary.total_commission_suc)}</div>
      </div>
      <div class="metric-card commission">
        <div class="metric-label">FSF</div>
        <div class="metric-value" style="color: ${summary.total_commission_fsf < 0 ? 'var(--info)' : 'var(--text-muted)'};">${formatCurrency(summary.total_commission_fsf)}</div>
      </div>
      <div class="metric-card ${profit > 0 ? 'profit' : 'loss'}">
        <div class="metric-label">Zysk</div>
        <div class="metric-value" style="color: ${profitColor};">${formatCurrency(profit)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Zysk/Trans.</div>
        <div class="metric-value" style="color: ${profitColor};">${formatCurrency(znt)}</div>
      </div>
    </div>
  `;
}

/**
 * Renderuje sekcje aukcji w 30 dniach
 */
function renderOffersSection(byOffer, sygnatura) {
  if (!byOffer || Object.keys(byOffer).length === 0) {
    return '';
  }

  const offersArray = Object.entries(byOffer)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.sold_quantity - a.sold_quantity);

  return `
    <div class="offers-section">
      <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">
        Per aukcja (${offersArray.length})
      </div>
      ${offersArray.map(offer => renderOfferSection(offer, sygnatura)).join('')}
    </div>
  `;
}

/**
 * Renderuje pojedyncza aukcje w sekcji 30 dni
 */
function renderOfferSection(offer, sygnatura) {
  const profitColor = offer.profit > 0 ? 'var(--success)' : 'var(--danger)';
  const transactionCount = offer.transactions?.length || 0;

  return `
    <div class="offer-section">
      <div class="offer-header" data-offer-toggle="${sygnatura}-${offer.id}">
        <div class="offer-header-left">
          <span class="offer-expand-icon">▶</span>
          <span class="offer-id">#${offer.id}</span>
          <span class="offer-name">${truncateText(offer.offer_name, 40)}</span>
          <span class="offer-trans">${transactionCount} / ${offer.sold_quantity}</span>
        </div>
        <div class="offer-header-right">
          <span class="offer-revenue">${formatCurrency(offer.revenue)}</span>
          <span class="offer-suc" style="color: var(--warning);">${formatCurrency(offer.commission_suc)}</span>
          <span class="offer-fsf" style="color: var(--info);">${formatCurrency(offer.commission_fsf)}</span>
          <span class="offer-profit" style="color: ${profitColor};">${formatCurrency(offer.profit)}</span>
        </div>
      </div>
      <div class="offer-content" style="display: none;">
        ${renderOfferTransactions(offer.transactions)}
      </div>
    </div>
  `;
}

/**
 * Renderuje transakcje aukcji bezposrednio (bez zagniezdzenia)
 */
function renderOfferTransactions(transactions) {
  if (!transactions || transactions.length === 0) {
    return '<div class="text-muted" style="font-size: 12px; padding: 8px;">Brak transakcji</div>';
  }

  return `
    <div class="offer-transactions">
      <div class="transaction-row transaction-row-header">
        <div class="transaction-left">
          <span class="transaction-cell transaction-date">Data</span>
          <span class="transaction-cell transaction-qty">Ilosc</span>
          <span class="transaction-cell transaction-price">Cena</span>
        </div>
        <div class="transaction-right">
          <span class="transaction-cell transaction-suc">SUC</span>
          <span class="transaction-cell transaction-fsf">FSF</span>
          <span class="transaction-cell transaction-profit">Zysk</span>
        </div>
      </div>
      ${transactions.map(t => renderTransactionItem30Days(t)).join('')}
    </div>
  `;
}

/**
 * Renderuje liste transakcji
 */
function renderTransactionsList(transactions, sygnatura, offerId) {
  if (!transactions || transactions.length === 0) {
    return '<div class="text-muted" style="font-size: 12px;">Brak transakcji</div>';
  }

  return `
    <div class="transactions-section">
      <div class="transactions-header" data-transactions-toggle="${sygnatura}-${offerId}"
           style="cursor: pointer; font-size: 12px; padding: 8px 0; border-top: 1px solid var(--border-color);">
        <span class="transactions-expand-icon">▶</span>
        <span>Transakcje (${transactions.length})</span>
      </div>
      <div class="transactions-list" style="display: none;">
        <div class="transaction-row transaction-row-header">
          <div class="transaction-left">
            <span class="transaction-cell transaction-date">Data</span>
            <span class="transaction-cell transaction-qty">Ilosc</span>
            <span class="transaction-cell transaction-price">Cena</span>
          </div>
          <div class="transaction-right">
            <span class="transaction-cell transaction-suc">SUC</span>
            <span class="transaction-cell transaction-fsf">FSF</span>
            <span class="transaction-cell transaction-profit">Zysk</span>
          </div>
        </div>
        ${transactions.map(t => renderTransactionItem30Days(t)).join('')}
      </div>
    </div>
  `;
}

/**
 * Renderuje pojedyncza transakcje w sekcji 30 dni
 */
function renderTransactionItem30Days(t) {
  const profitColor = t.profit > 0 ? 'var(--success)' : 'var(--danger)';

  return `
    <div class="transaction-row">
      <div class="transaction-left">
        <span class="transaction-cell transaction-date">${t.date.split('T')[0]} ${t.time}</span>
        <span class="transaction-cell transaction-qty">${t.quantity} szt.</span>
        <span class="transaction-cell transaction-price">${formatCurrency(t.total_price)}</span>
      </div>
      <div class="transaction-right">
        <span class="transaction-cell transaction-suc" style="color: var(--warning);">${formatCurrency(t.commission_suc)}</span>
        <span class="transaction-cell transaction-fsf" style="color: var(--info);">${formatCurrency(t.commission_fsf)}</span>
        <span class="transaction-cell transaction-profit" style="color: ${profitColor};">${formatCurrency(t.profit)}</span>
      </div>
    </div>
  `;
}

/**
 * Zwraca ikone sortowania
 */
function getSortIcon(field, currentField, currentDir) {
  if (field !== currentField) return '↕';
  return currentDir === 'asc' ? '↑' : '↓';
}

/**
 * Renderuje skeleton loading
 */
function renderSkeletons() {
  // Top products skeleton
  const topProducts = document.getElementById('topProductsSection');
  if (topProducts) {
    topProducts.innerHTML = `
      <div class="top-products-card">
        <div class="skeleton" style="height: 180px;"></div>
      </div>
    `;
  }

  // Global summary skeleton
  const globalSummary = document.getElementById('globalSummary');
  if (globalSummary) {
    globalSummary.innerHTML = `
      <div class="global-summary-card">
        <div class="skeleton" style="height: 80px; border-radius: 8px;"></div>
      </div>
    `;
  }

  // Table skeleton
  const productsTable = document.getElementById('productsTable');
  if (productsTable) {
    productsTable.innerHTML = `
      <div style="padding: 20px;">
        ${Array(5).fill('<div class="skeleton skeleton-text" style="margin-bottom: 16px;"></div>').join('')}
      </div>
    `;
  }
}

/**
 * Renderuje toast notification
 */
function renderToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
    <div class="toast-content">
      <div class="toast-title">${type === 'success' ? 'Sukces' : 'Blad'}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  // Auto-remove
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, CONFIG.TOAST_DURATION);
}

/**
 * Renderuje loading overlay
 */
function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.style.display = 'none';
}

/**
 * Renderuje error state
 */
function renderError(message) {
  const main = document.querySelector('.dashboard');
  main.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">❌</div>
      <div class="empty-state-title">Blad ladowania danych</div>
      <p style="color: var(--text-muted); margin-bottom: 20px;">${message}</p>
      <button class="btn btn-primary" onclick="location.reload()">
        Sprobuj ponownie
      </button>
    </div>
  `;
}

/**
 * Renderuje ekran logowania
 */
function renderLoginScreen() {
  document.body.innerHTML = `
    <div class="particles"></div>
    <div class="login-container">
      <div class="login-box">
        <div class="login-logo">
          <div class="logo-icon animate-pulse">📊</div>
          <h1 class="title-gradient">Allegro Analytics</h1>
        </div>
        <p class="login-subtitle">Wprowadz haslo dostepu</p>
        <form id="loginForm" class="login-form">
          <input
            type="password"
            id="passwordInput"
            class="login-input"
            placeholder="Haslo"
            autocomplete="current-password"
            autofocus
          >
          <button type="submit" id="loginBtn" class="btn btn-primary login-btn">
            Zaloguj
          </button>
        </form>
        <p id="errorMsg" class="login-error"></p>
      </div>
    </div>
  `;

  // Utworz particles
  createParticles();
}

/**
 * Podlacza eventy do ekranu logowania
 */
function attachLoginListeners() {
  const form = document.getElementById('loginForm');
  const passwordInput = document.getElementById('passwordInput');
  const errorMsg = document.getElementById('errorMsg');
  const loginBtn = document.getElementById('loginBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = passwordInput.value;

    if (!password) {
      errorMsg.textContent = 'Wprowadz haslo';
      return;
    }

    // Disable button podczas weryfikacji
    loginBtn.disabled = true;
    loginBtn.textContent = 'Weryfikacja...';
    errorMsg.textContent = '';

    try {
      const isValid = await verifyPassword(password);

      if (isValid) {
        setAuth(true);
        updateLastActivity();
        location.reload();
      } else {
        errorMsg.textContent = 'Nieprawidlowe haslo';
        passwordInput.value = '';
        passwordInput.focus();
      }
    } catch (error) {
      console.error('Blad weryfikacji:', error);
      errorMsg.textContent = 'Wystapil blad. Sprobuj ponownie.';
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Zaloguj';
    }
  });
}
