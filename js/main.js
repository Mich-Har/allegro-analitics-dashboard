/* ===========================================
   ALLEGRO ANALYTICS DASHBOARD - MAIN
   Glowna logika i event handlers
   =========================================== */

// Stan aplikacji
let currentSort = { ...CONFIG.DEFAULT_SORT };
let currentFilters = {};
let expandedProducts = new Set();
let currentSearchQuery = '';
let searchDebounceTimer = null;

/**
 * Inicjalizacja aplikacji
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Sprawdz autoryzacje
  if (!checkAuth()) {
    renderLoginScreen();
    attachLoginListeners();
    return;
  }

  // Sprawdz czy sesja nie wygasla
  if (checkSessionTimeout()) {
    return; // Uzytkownik zostal wylogowany
  }

  // Uzytkownik zalogowany - zaladuj dashboard
  await initDashboard();

  // Uruchom sledzenie aktywnosci i timeout
  startActivityTracking();
  startSessionTimeoutCheck();
});

/**
 * Uruchamia sledzenie aktywnosci uzytkownika (klikniecia)
 */
function startActivityTracking() {
  // Ustaw poczatkowa aktywnosc
  updateLastActivity();

  // Sluchaj klikniec na calym dokumencie
  document.addEventListener('click', () => {
    updateLastActivity();
  });
}

/**
 * Inicjalizuje dashboard (po autoryzacji)
 */
async function initDashboard() {
  try {
    // Pokaz loading
    renderSkeletons();

    // Zaladuj dane
    const data = await loadData();

    // Wyrenderuj dashboard
    renderDashboard(data);

    // Podepnij eventy
    attachEventListeners();

    // Dodaj klase loaded dla animacji
    setTimeout(() => {
      document.body.classList.add('loaded');
    }, 100);

  } catch (error) {
    console.error('Blad inicjalizacji:', error);
    renderError('Nie udalo sie zaladowac danych. Sprawdz czy plik final_output_for_frontend.txt istnieje.');
  }
}

/**
 * Podlacza event listeners
 */
function attachEventListeners() {
  // Przycisk odswiezania
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', handleRefresh);
  }

  // Sortowanie tabeli
  document.addEventListener('click', (e) => {
    const th = e.target.closest('th[data-sort]');
    if (th) {
      handleSort(th.dataset.sort);
    }
  });

  // Rozwijanie wierszy produktow (ignoruj klikniecia na elementy edycji)
  document.addEventListener('click', (e) => {
    const row = e.target.closest('.product-row');
    if (row && !e.target.closest('a') && !e.target.closest('.edit-name-btn') && !e.target.closest('.edit-name-container')) {
      handleProductExpand(row.dataset.sygnatura);
    }
  });

  // Edycja nazwy produktu - klikniecie na ikone edycji
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-name-btn');
    if (editBtn) {
      e.stopPropagation();
      const sygnatura = editBtn.dataset.sygnatura;
      const currentName = editBtn.dataset.currentName;
      showEditNameField(sygnatura, currentName);
    }
  });

  // Edycja nazwy produktu - zatwierdzenie (tick)
  document.addEventListener('click', (e) => {
    const confirmBtn = e.target.closest('.edit-name-confirm');
    if (confirmBtn) {
      e.stopPropagation();
      const sygnatura = confirmBtn.dataset.sygnatura;
      const input = document.querySelector(`.edit-name-input[data-sygnatura="${sygnatura}"]`);
      if (input) {
        confirmNameEdit(sygnatura, input.value);
      }
    }
  });

  // Edycja nazwy produktu - anulowanie (X)
  document.addEventListener('click', (e) => {
    const cancelBtn = e.target.closest('.edit-name-cancel');
    if (cancelBtn) {
      e.stopPropagation();
      const sygnatura = cancelBtn.dataset.sygnatura;
      cancelNameEdit(sygnatura);
    }
  });

  // Edycja nazwy produktu - Enter/Escape w input
  document.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('edit-name-input')) {
      const sygnatura = e.target.dataset.sygnatura;
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmNameEdit(sygnatura, e.target.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelNameEdit(sygnatura);
      }
    }
  });

  // Rozwijanie rynkow (aukcje)
  document.addEventListener('click', (e) => {
    const marketHeader = e.target.closest('.market-header-collapsible');
    if (marketHeader) {
      handleMarketExpand(marketHeader);
    }
  });

  // Rozwijanie grup aukcji (aktywne/zakonczone)
  document.addEventListener('click', (e) => {
    const auctionGroupHeader = e.target.closest('.auction-group-toggle');
    if (auctionGroupHeader) {
      handleAuctionGroupExpand(auctionGroupHeader);
    }
  });

  // Rozwijanie sekcji 30 dni
  document.addEventListener('click', (e) => {
    const header = e.target.closest('.summary-30-days-header');
    if (header) {
      handleSummary30DaysExpand(header);
    }
  });

  // Rozwijanie szczegolow aukcji w sekcji 30 dni
  document.addEventListener('click', (e) => {
    const header = e.target.closest('.offer-header');
    if (header) {
      handleOfferExpand(header);
    }
  });

  // Rozwijanie transakcji w sekcji 30 dni
  document.addEventListener('click', (e) => {
    const header = e.target.closest('.transactions-header');
    if (header) {
      handleTransactionsExpand(header);
    }
  });

  // Przycisk "Zwin wszystko"
  document.addEventListener('click', (e) => {
    if (e.target.closest('#collapseAllBtn')) {
      handleCollapseAll();
    }
  });

  // Wyszukiwanie produktow (z debounce 300ms)
  document.addEventListener('input', (e) => {
    if (e.target.id === 'productSearch') {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        handleSearch(e.target.value);
      }, 300);
    }
  });

  // Zamykanie panelu bocznego
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('side-panel-overlay')) {
      closeSidePanel();
    }
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidePanel();
    }
  });

  // Klikniecie na produkt w kartach statusu - przewin do produktu w tabeli
  document.addEventListener('click', (e) => {
    const statusItem = e.target.closest('.status-item');
    if (statusItem && statusItem.dataset.sygnatura) {
      scrollToProductAndHighlight(statusItem.dataset.sygnatura);
    }
  });
}

/**
 * Obsluga odswiezania danych
 */
async function handleRefresh() {
  const btn = document.getElementById('refreshBtn');
  const btnText = btn.querySelector('.btn-text');
  const btnIcon = btn.querySelector('.refresh-icon');

  try {
    // Disable button i animacja
    btn.disabled = true;
    btnText.textContent = 'Odswiezanie...';
    btnIcon.classList.add('spinning');

    // Dodaj klase refreshing do body
    document.body.classList.add('refreshing');

    // Fade out content
    document.querySelectorAll('.global-summary-card, .chart-container, .table-section').forEach(el => {
      el.style.opacity = '0.5';
    });

    // Zaladuj dane ponownie
    const data = await loadData();

    // Re-renderuj
    renderDashboard(data);

    // Fade in content
    document.querySelectorAll('.global-summary-card, .chart-container, .table-section').forEach(el => {
      el.style.opacity = '1';
    });

    // Success toast
    renderToast('Dane odswiezone pomyslnie!', 'success');

    // Update timestamp
    updateTimestamp();

  } catch (error) {
    console.error('Blad odswiezania:', error);
    renderToast('Nie udalo sie odswiezyc danych', 'error');
  } finally {
    // Reset button
    btn.disabled = false;
    btnText.textContent = 'Odswiez dane';
    btnIcon.classList.remove('spinning');
    document.body.classList.remove('refreshing');
  }
}

/**
 * Obsluga sortowania
 */
function handleSort(field) {
  // Toggle kierunku jesli ten sam field
  if (currentSort.field === field) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.field = field;
    currentSort.direction = 'desc';
  }

  // Re-renderuj tabele
  renderProductsTable(
    processedData.products,
    currentSort.field,
    currentSort.direction,
    currentSearchQuery
  );

  // Re-attach expand listeners
  expandedProducts.forEach(sygnatura => {
    const expandedRow = document.getElementById(`expanded-${sygnatura}`);
    if (expandedRow) {
      expandedRow.style.display = 'table-row';
    }
  });
}

/**
 * Obsluga rozwijania produktu
 */
function handleProductExpand(sygnatura) {
  const expandedRow = document.getElementById(`expanded-${sygnatura}`);
  const productRow = document.querySelector(`tr[data-sygnatura="${sygnatura}"]`);

  if (!expandedRow) return;

  const isExpanded = expandedProducts.has(sygnatura);

  if (isExpanded) {
    // Zwijn
    expandedRow.style.display = 'none';
    productRow.classList.remove('expanded');
    expandedProducts.delete(sygnatura);
  } else {
    // Rozwin
    expandedRow.style.display = 'table-row';
    productRow.classList.add('expanded');
    expandedProducts.add(sygnatura);

    // Animacja
    expandedRow.querySelector('.expanded-inner').classList.add('animate-slideDown');
  }
}

/**
 * Obsluga rozwijania rynku (aukcje)
 */
function handleMarketExpand(header) {
  const marketSection = header.closest('.market-section');
  const auctionsContainer = marketSection.querySelector('.market-auctions-collapse');
  const expandIcon = header.querySelector('.market-expand-icon');

  if (!auctionsContainer) return;

  const isExpanded = auctionsContainer.style.display !== 'none';

  if (isExpanded) {
    // Zwin
    auctionsContainer.style.display = 'none';
    expandIcon.textContent = '▶';
    expandIcon.classList.remove('expanded');
  } else {
    // Rozwin
    auctionsContainer.style.display = 'block';
    expandIcon.textContent = '▼';
    expandIcon.classList.add('expanded');
  }
}

/**
 * Obsluga rozwijania grupy aukcji (aktywne/zakonczone)
 */
function handleAuctionGroupExpand(header) {
  const auctionGroup = header.closest('.auction-group');
  const auctionList = auctionGroup.querySelector('.auction-list-collapse');
  const expandIcon = header.querySelector('.auction-expand-icon');

  if (!auctionList) return;

  const isExpanded = auctionList.style.display !== 'none';

  if (isExpanded) {
    // Zwin
    auctionList.style.display = 'none';
    expandIcon.textContent = '▶';
  } else {
    // Rozwin
    auctionList.style.display = 'block';
    expandIcon.textContent = '▼';
  }
}

/**
 * Obsluga rozwijania sekcji 30 dni
 */
function handleSummary30DaysExpand(header) {
  const section = header.closest('.summary-30-days');
  const content = section.querySelector('.summary-30-days-content');
  const icon = header.querySelector('.summary-expand-icon');

  const isExpanded = content.style.display !== 'none';
  content.style.display = isExpanded ? 'none' : 'block';
  icon.textContent = isExpanded ? '▶' : '▼';
}

/**
 * Obsluga rozwijania szczegolow aukcji w sekcji 30 dni
 */
function handleOfferExpand(header) {
  const section = header.closest('.offer-section');
  const content = section.querySelector('.offer-content');
  const icon = header.querySelector('.offer-expand-icon');

  const isExpanded = content.style.display !== 'none';
  content.style.display = isExpanded ? 'none' : 'block';
  icon.textContent = isExpanded ? '▶' : '▼';
}

/**
 * Obsluga rozwijania transakcji w sekcji 30 dni
 */
function handleTransactionsExpand(header) {
  const section = header.closest('.transactions-section');
  const content = section.querySelector('.transactions-list');
  const icon = header.querySelector('.transactions-expand-icon');

  const isExpanded = content.style.display !== 'none';
  content.style.display = isExpanded ? 'none' : 'block';
  icon.textContent = isExpanded ? '▶' : '▼';
}

/**
 * Obsluga zwijania wszystkiego
 */
function handleCollapseAll() {
  // Zwin wszystkie produkty
  expandedProducts.forEach(sygnatura => {
    const expandedRow = document.getElementById(`expanded-${sygnatura}`);
    const productRow = document.querySelector(`tr[data-sygnatura="${sygnatura}"]`);
    if (expandedRow) {
      expandedRow.style.display = 'none';
    }
    if (productRow) {
      productRow.classList.remove('expanded');
    }
  });
  expandedProducts.clear();

  // Zwin wszystkie sekcje 30 dni
  document.querySelectorAll('.summary-30-days-content').forEach(content => {
    content.style.display = 'none';
  });
  document.querySelectorAll('.summary-expand-icon').forEach(icon => {
    icon.textContent = '▶';
  });

  // Zwin wszystkie aukcje w sekcji 30 dni
  document.querySelectorAll('.offer-content').forEach(content => {
    content.style.display = 'none';
  });
  document.querySelectorAll('.offer-expand-icon').forEach(icon => {
    icon.textContent = '▶';
  });

  // Zwin wszystkie transakcje
  document.querySelectorAll('.transactions-list').forEach(list => {
    list.style.display = 'none';
  });
  document.querySelectorAll('.transactions-expand-icon').forEach(icon => {
    icon.textContent = '▶';
  });

  // Zwin wszystkie rynki
  document.querySelectorAll('.market-auctions-collapse').forEach(container => {
    container.style.display = 'none';
  });
  document.querySelectorAll('.market-expand-icon').forEach(icon => {
    icon.textContent = '▶';
    icon.classList.remove('expanded');
  });

  // Zwin wszystkie grupy aukcji
  document.querySelectorAll('.auction-list-collapse').forEach(list => {
    list.style.display = 'none';
  });
  document.querySelectorAll('.auction-expand-icon').forEach(icon => {
    icon.textContent = '▶';
  });
}

/**
 * Obsluga wyszukiwania
 */
function handleSearch(query) {
  currentSearchQuery = query;
  renderProductsTable(
    processedData.products,
    currentSort.field,
    currentSort.direction,
    currentSearchQuery
  );
}

/**
 * Obsluga filtrow
 */
function handleFilter(type, value) {
  currentFilters[type] = value;

  const filteredProducts = filterProducts(processedData.products, currentFilters);

  renderProductsTable(
    filteredProducts,
    currentSort.field,
    currentSort.direction
  );
}

/**
 * Zamyka panel boczny
 */
function closeSidePanel() {
  const panel = document.querySelector('.side-panel');
  const overlay = document.querySelector('.side-panel-overlay');

  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

/**
 * Otwiera panel boczny z detalami rynku
 */
function openMarketPanel(marketId) {
  const market = processedData.markets[marketId];
  if (!market) return;

  const panel = document.querySelector('.side-panel');
  const overlay = document.querySelector('.side-panel-overlay');

  // Renderuj content
  panel.innerHTML = `
    <div class="side-panel-header">
      <h3>
        <span class="market-flag">
          <span class="flag">${market.flag}</span>
          ${market.name}
        </span>
      </h3>
      <button class="close-btn" onclick="closeSidePanel()">×</button>
    </div>
    <div class="side-panel-content">
      <div style="margin-bottom: 24px;">
        <h4 style="color: var(--text-muted); font-size: 12px; text-transform: uppercase; margin-bottom: 12px;">
          📊 Statystyki
        </h4>
        <div style="display: grid; gap: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Sprzedaz:</span>
            <strong class="text-mono">${market.totalSales} szt.</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Wyswietlenia:</span>
            <strong class="text-mono">${formatNumber(market.totalViews)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Konwersja:</span>
            <strong class="text-mono">${formatPercent(market.conversion)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Aukcje:</span>
            <strong class="text-mono">${market.auctionCount}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Produkty:</span>
            <strong class="text-mono">${market.productCount}</strong>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="color: var(--text-muted); font-size: 12px; text-transform: uppercase; margin-bottom: 12px;">
          📈 Klasyfikacja
        </h4>
        <span class="badge" style="background: ${market.classification.color}20; color: ${market.classification.color}; border-color: ${market.classification.color};">
          ${market.classification.icon} ${market.classification.status}
        </span>
      </div>
    </div>
  `;

  // Pokaz panel
  panel.classList.add('open');
  overlay.classList.add('open');
}

/**
 * Aktualizuje timestamp w headerze
 */
function updateTimestamp() {
  const meta = document.querySelector('.header-meta');
  if (meta) {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    meta.textContent = `Ostatnia aktualizacja: ${formattedDate}`;
  }
}

/**
 * Tworzy particles w tle
 */
function createParticles() {
  const container = document.querySelector('.particles');
  if (!container) return;

  const colors = ['var(--primary)', 'var(--secondary)', 'var(--info)'];

  for (let i = 0; i < 5; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
      width: ${100 + Math.random() * 200}px;
      height: ${100 + Math.random() * 200}px;
      background: ${colors[i % colors.length]};
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-delay: ${-Math.random() * 20}s;
    `;
    container.appendChild(particle);
  }
}

// ============================================
// EDYCJA NAZWY PRODUKTU
// ============================================

/**
 * Pokazuje pole edycji nazwy produktu
 */
function showEditNameField(sygnatura, currentName) {
  const nameRow = document.querySelector(`.product-row[data-sygnatura="${sygnatura}"] .product-name-row`);
  if (!nameRow) return;

  // Zapisz oryginalna zawartosc
  nameRow.dataset.originalHtml = nameRow.innerHTML;

  // Zamien na pole edycji
  nameRow.innerHTML = `
    <div class="edit-name-container">
      <input type="text"
             class="edit-name-input"
             data-sygnatura="${sygnatura}"
             value="${currentName.replace(/"/g, '&quot;')}"
             placeholder="Wpisz nowa nazwe..."
             autofocus>
      <span class="edit-name-confirm" data-sygnatura="${sygnatura}" title="Zatwierdz (Enter)">✓</span>
      <span class="edit-name-cancel" data-sygnatura="${sygnatura}" title="Anuluj (Escape)">✗</span>
    </div>
  `;

  // Focus na input
  const input = nameRow.querySelector('.edit-name-input');
  if (input) {
    input.focus();
    input.select();
  }
}

/**
 * Zatwierdza edycje nazwy produktu
 */
async function confirmNameEdit(sygnatura, newName) {
  const nameRow = document.querySelector(`.product-row[data-sygnatura="${sygnatura}"] .product-name-row`);
  if (!nameRow) return;

  // Walidacja
  if (!newName || newName.trim() === '') {
    renderToast('Nazwa nie moze byc pusta', 'error');
    return;
  }

  const trimmedName = newName.trim();

  // Pokaz loading
  const container = nameRow.querySelector('.edit-name-container');
  if (container) {
    container.innerHTML = `<span class="edit-name-loading">Zapisywanie...</span>`;
  }

  // Wyslij do n8n
  const success = await updateProductName(sygnatura, trimmedName);

  if (success) {
    // Zaktualizuj UI z nowa nazwa
    nameRow.innerHTML = `
      <span class="product-name tooltip" data-tooltip="${trimmedName}" data-sygnatura="${sygnatura}">
        ${truncateText(trimmedName, 60)}
      </span>
      <span class="edit-name-btn" data-sygnatura="${sygnatura}" data-current-name="${trimmedName.replace(/"/g, '&quot;')}" title="Edytuj nazwe">✏️</span>
    `;
    renderToast('Nazwa produktu zaktualizowana', 'success');
  } else {
    // Przywroc oryginalna zawartosc
    if (nameRow.dataset.originalHtml) {
      nameRow.innerHTML = nameRow.dataset.originalHtml;
    }
    renderToast('Blad zapisu nazwy produktu', 'error');
  }
}

/**
 * Anuluje edycje nazwy produktu
 */
function cancelNameEdit(sygnatura) {
  const nameRow = document.querySelector(`.product-row[data-sygnatura="${sygnatura}"] .product-name-row`);
  if (!nameRow || !nameRow.dataset.originalHtml) return;

  // Przywroc oryginalna zawartosc
  nameRow.innerHTML = nameRow.dataset.originalHtml;
}

// ============================================
// PRZEWIJANIE DO PRODUKTU Z KART STATUSU
// ============================================

/**
 * Przewija do produktu w tabeli i podswietla go
 */
function scrollToProductAndHighlight(sygnatura) {
  const productRow = document.querySelector(`.product-row[data-sygnatura="${sygnatura}"]`);
  if (!productRow) {
    renderToast('Nie znaleziono produktu w tabeli', 'error');
    return;
  }

  // Usun poprzednie podswietlenie
  document.querySelectorAll('.product-row.highlight').forEach(row => {
    row.classList.remove('highlight');
  });

  // Przewin do produktu - uzyj scrollIntoView aby zawsze byl widoczny
  productRow.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

  // Dodaj podswietlenie po zakonczeniu przewijania
  setTimeout(() => {
    productRow.classList.add('highlight');
  }, 500);
}

// Utworz particles przy starcie
createParticles();
