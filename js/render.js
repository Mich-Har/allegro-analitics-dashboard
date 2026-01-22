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
function renderProductsTable(products, sortField = 'sales', sortDir = 'desc', searchQuery = '', activeOnly = false) {
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

  // Filtruj produkty tylko z aktywnymi aukcjami
  if (activeOnly) {
    filteredProducts = filteredProducts.filter(p => {
      const uniqueAuctions = getUniqueAuctions(p);
      return uniqueAuctions.some(a => a.status === 'ACTIVE');
    });
  }

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
