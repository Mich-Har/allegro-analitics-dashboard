/* ===========================================
   ALLEGRO ANALYTICS DASHBOARD - RENDER
   Renderowanie komponentow UI
   =========================================== */

/**
 * Renderuje caly dashboard
 */
function renderDashboard(data) {
  renderHeader();
  renderKPICards(data.kpis);
  renderCharts(data.topProducts, data.markets);
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
 * Renderuje karty KPI
 */
function renderKPICards(kpis) {
  const container = document.getElementById('kpiGrid');

  const cards = [
    {
      icon: '📊',
      value: kpis.totalSales,
      label: 'Calkowita Sprzedaz',
      accent: 'success',
      format: 'number',
    },
    {
      icon: '👁️',
      value: kpis.totalViews,
      label: 'Calkowite Wyswietlenia',
      accent: 'info',
      format: 'number',
    },
    {
      icon: '🎯',
      value: kpis.avgConversion,
      label: 'Srednia Konwersja',
      accent: 'warning',
      format: 'percent',
    },
    {
      icon: '🏆',
      value: kpis.topProduct?.product_name || 'Brak danych',
      label: 'Top Produkt',
      subtext: kpis.topProduct
        ? `${kpis.topProduct.podsumowanie_globalne?.suma_sprzedanych_total || 0} szt.`
        : '',
      signature: kpis.topProduct?.sygnatura || '',
      accent: 'secondary',
      format: 'text',
    },
  ];

  container.innerHTML = cards.map((card, index) => `
    <div class="kpi-card animate-fadeIn stagger-${index + 1}" data-accent="${card.accent}">
      <div class="kpi-icon">${card.icon}</div>
      <div class="kpi-value" data-value="${card.format === 'number' || card.format === 'percent' ? card.value : ''}" data-format="${card.format}">
        ${formatKPIValue(card.value, card.format)}
      </div>
      ${card.signature ? `<div class="kpi-signature">${card.signature}</div>` : ''}
      <div class="kpi-label">${card.label}</div>
      ${card.subtext ? `<div class="kpi-trend">${card.subtext}</div>` : ''}
    </div>
  `).join('');

  // Animacja liczenia
  if (document.body.classList.contains('animate-numbers')) {
    animateKPINumbers();
  }
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
  // Bar chart - top produkty
  const barContainer = document.getElementById('barChart');
  const barChartData = prepareBarChartData(topProducts);
  renderBarChart(barContainer, barChartData, {
    width: 520,
    height: Math.max(200, topProducts.length * 44 + 30),
    labelWidth: 180,
    barHeight: 28,
    fontSize: 11,
    animated: true,
  });

  // Donut chart - rynki
  const donutContainer = document.getElementById('donutChart');
  const donutChartData = prepareDonutChartData(markets);
  renderDonutChart(donutContainer, donutChartData, {
    size: 250,
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
            Wyswietlenia <span class="sort-icon">${getSortIcon('views', sortField, sortDir)}</span>
          </th>
          <th data-sort="sales" class="${sortField === 'sales' ? 'sorted' : ''}">
            Sprzedaz <span class="sort-icon">${getSortIcon('sales', sortField, sortDir)}</span>
          </th>
          <th data-sort="conversion" class="${sortField === 'conversion' ? 'sorted' : ''}">
            Konwersja <span class="sort-icon">${getSortIcon('conversion', sortField, sortDir)}</span>
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

  const inactiveClass = !hasActiveAuctions ? 'product-inactive' : '';
  const conversionBadgeClass = !hasActiveAuctions ? 'badge-neutral' :
    (conversionStatus.class === 'high' ? 'badge-success' : conversionStatus.class === 'medium' ? 'badge-warning' : 'badge-danger');

  return `
    <tr class="product-row ${inactiveClass}" data-sygnatura="${product.sygnatura}" data-index="${index}">
      <td>
        <div class="product-cell">
          <span class="product-name tooltip" data-tooltip="${product.product_name || ''}">
            ${truncateText(product.product_name || '-', 40)}
          </span>
          <span class="product-signature">${product.sygnatura}</span>
        </div>
      </td>
      <td style="text-align: right;">
        <span class="text-mono">${formatNumber(activeViews)}</span>
      </td>
      <td style="text-align: right;">
        <strong class="text-mono">${activeSales} szt.</strong>
      </td>
      <td style="text-align: right;">
        <span class="badge ${conversionBadgeClass}">
          ${formatPercent(activeConversion)}
        </span>
      </td>
      <td style="text-align: right;">
        <span class="text-mono ${stockClass}">${typeof stock === 'number' ? stock + ' szt.' : stock}</span>
      </td>
      <td style="text-align: center;">
        <span class="text-mono">
          <span style="color: var(--success);">${activeAuctionsCount}</span><span style="color: var(--text-muted);">/${endedAuctionsCount}</span>
        </span>
      </td>
    </tr>
    <tr class="expanded-content" id="expanded-${product.sygnatura}" style="display: none;">
      <td colspan="6">
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
 * Renderuje sekcje "Ostatnie 30 dni"
 */
function renderSummary30Days(product) {
  const summary = product.summary_last_30_days;

  // Brak danych
  if (!summary) {
    return `
      <div class="summary-30-days">
        <div class="summary-30-days-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="summary-expand-icon">▶</span>
            <strong>📊 Ostatnie 30 dni</strong>
          </div>
        </div>
        <div class="summary-30-days-content" style="display: none;">
          <div class="empty-30-days">
            ℹ️ Brak sprzedazy w ostatnich 30 dniach
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="summary-30-days">
      <div class="summary-30-days-header" data-summary-toggle="${product.sygnatura}">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="summary-expand-icon">▶</span>
          <strong>📊 Ostatnie 30 dni</strong>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="badge badge-success">${summary.total_sold_quantity} szt.</span>
          <span class="text-mono" style="color: var(--success);">
            ${formatCurrency(summary.total_profit)} zysku
          </span>
        </div>
      </div>
      <div class="summary-30-days-content" style="display: none;">
        ${renderSummaryMetrics(summary)}
        ${renderOffersSection(summary.by_offer, product.sygnatura)}
      </div>
    </div>
  `;
}

/**
 * Renderuje metryki podsumowania 30 dni
 */
function renderSummaryMetrics(summary) {
  return `
    <div class="summary-30-days-metrics">
      <div class="metric-card">
        <div class="metric-label">Sprzedano</div>
        <div class="metric-value">${summary.total_sold_quantity} szt.</div>
      </div>
      <div class="metric-card revenue">
        <div class="metric-label">Przychod</div>
        <div class="metric-value" style="color: var(--info);">
          ${formatCurrency(summary.total_revenue)}
        </div>
      </div>
      <div class="metric-card commission">
        <div class="metric-label">Prowizja SUC</div>
        <div class="metric-value" style="color: var(--warning);">
          ${formatCurrency(summary.total_commission_suc)}
        </div>
      </div>
      <div class="metric-card commission">
        <div class="metric-label">Prowizja FSF</div>
        <div class="metric-value" style="color: ${summary.total_commission_fsf < 0 ? 'var(--info)' : 'var(--text-muted)'};">
          ${formatCurrency(summary.total_commission_fsf)}
        </div>
      </div>
      <div class="metric-card ${summary.total_profit > 0 ? 'profit' : 'loss'}">
        <div class="metric-label">Zysk netto</div>
        <div class="metric-value" style="color: ${summary.total_profit > 0 ? 'var(--success)' : 'var(--danger)'};">
          ${formatCurrency(summary.total_profit)}
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Transakcji</div>
        <div class="metric-value">${summary.transaction_count}</div>
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
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">
        Szczegoly per aukcja (${offersArray.length})
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

  return `
    <div class="offer-section">
      <div class="offer-header" data-offer-toggle="${sygnatura}-${offer.id}">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="offer-expand-icon">▶</span>
          <span class="text-mono" style="color: var(--text-muted);">#${offer.id}</span>
          <span style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${truncateText(offer.offer_name, 50)}
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; font-size: 12px;">
          <span>${offer.sold_quantity} szt.</span>
          <span class="text-mono" style="color: ${profitColor};">
            ${formatCurrency(offer.profit)}
          </span>
        </div>
      </div>
      <div class="offer-content" style="display: none;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 11px; color: var(--text-muted);">Przychod</div>
            <div class="text-mono">${formatCurrency(offer.revenue)}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: var(--text-muted);">Prowizja SUC</div>
            <div class="text-mono" style="color: var(--warning);">${formatCurrency(offer.commission_suc)}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: var(--text-muted);">Prowizja FSF</div>
            <div class="text-mono" style="color: var(--info);">${formatCurrency(offer.commission_fsf)}</div>
          </div>
        </div>
        ${renderTransactionsList(offer.transactions, sygnatura, offer.id)}
      </div>
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
    <div class="transaction-item">
      <div style="display: flex; gap: 12px; align-items: center;">
        <span class="text-muted">${t.date} ${t.time}</span>
        <span>${t.quantity} szt.</span>
        <span class="text-mono">${formatCurrency(t.total_price)}</span>
      </div>
      <div style="display: flex; gap: 12px; align-items: center;">
        <span style="color: var(--warning);">${formatCurrency(t.commission_total)}</span>
        <span class="text-mono" style="color: ${profitColor}; font-weight: 600;">
          ${formatCurrency(t.profit)}
        </span>
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
  // KPI skeletons
  const kpiGrid = document.getElementById('kpiGrid');
  kpiGrid.innerHTML = Array(4).fill(`
    <div class="kpi-card">
      <div class="skeleton skeleton-text" style="width: 40px; height: 28px; margin-bottom: 12px;"></div>
      <div class="skeleton skeleton-title" style="width: 80%;"></div>
      <div class="skeleton skeleton-text" style="width: 60%;"></div>
    </div>
  `).join('');

  // Chart skeletons
  document.getElementById('barChart').innerHTML = '<div class="skeleton" style="height: 250px;"></div>';
  document.getElementById('donutChart').innerHTML = '<div class="skeleton" style="height: 250px; width: 250px; border-radius: 50%; margin: 0 auto;"></div>';

  // Table skeleton
  document.getElementById('productsTable').innerHTML = `
    <div style="padding: 20px;">
      ${Array(5).fill('<div class="skeleton skeleton-text" style="margin-bottom: 16px;"></div>').join('')}
    </div>
  `;
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
