/* ===========================================
   ALLEGRO ANALYTICS DASHBOARD - CONFIG
   Konfiguracja i stale
   =========================================== */

const CONFIG = {
  // ============================================
  // SESJA I AUTORYZACJA
  // ============================================

  // Timeout sesji w minutach (po tym czasie bez aktywnosci wymaga ponownego logowania)
  // Ustaw na mala wartosc (np. 1) do testow
  SESSION_TIMEOUT_MINUTES: 1,

  // Jak czesto sprawdzac timeout (w sekundach)
  SESSION_CHECK_INTERVAL_SECONDS: 60,

  // ============================================
  // ZRODLO DANYCH - WYBIERZ JEDNO:
  // ============================================

  // OPCJA 1: Webhook n8n (ZALECANE)
  // Wklej URL swojego webhooka z n8n
  WEBHOOK_URL: 'https://n8n-app.coolify.mihara.space/webhook/allegro-analytics',

  // OPCJA 2: Lokalny plik (do testow)
  DATA_FILE: 'final_output_for_frontend.txt',

  // Wybor zrodla: 'webhook' lub 'file'
  DATA_SOURCE: 'webhook',

  // Blacklista sygnatur (produkty do pominiecia)
  BLACKLIST_SIGNATURES: [
    'Niedowyslania',
    // Dodaj wiecej wedlug potrzeb
  ],

  // Minimum wyswietlen dla "Top Produktu"
  MIN_VIEWS_FOR_TOP_PRODUCT: 20,

  // Minimum wyswietlen dla listy produktow (0 = wszystkie)
  MIN_VIEWS_FOR_LISTING: 0,

  // Progi konwersji (w procentach)
  CONVERSION_THRESHOLDS: {
    HIGH: 0.5,    // > 0.5% = zielony
    MEDIUM: 0.1,  // 0.1-0.5% = pomaranczowy
    // < 0.1% = czerwony
  },

  // Mapowanie rynkow
  MARKETS: {
    'allegro-pl': { name: 'Polska', flag: '🇵🇱', code: 'PL' },
    'allegro-cz': { name: 'Czechy', flag: '🇨🇿', code: 'CZ' },
    'allegro-sk': { name: 'Slowacja', flag: '🇸🇰', code: 'SK' },
    'allegro-hu': { name: 'Wegry', flag: '🇭🇺', code: 'HU' },
    'allegro-business-pl': { name: 'B2B Polska', flag: '', code: 'B2B-PL' },
    'allegro-business-cz': { name: 'B2B Czechy', flag: '', code: 'B2B-CZ' },
  },

  // Kolory dla wykresow (per rynek)
  MARKET_COLORS: {
    'allegro-pl': '#ef4444',
    'allegro-cz': '#3b82f6',
    'allegro-sk': '#10b981',
    'allegro-hu': '#f59e0b',
    'allegro-business-pl': '#8b5cf6',
    'allegro-business-cz': '#ec4899',
  },

  // Kolory dla wykresow (top produkty)
  CHART_COLORS: [
    '#6366f1',
    '#8b5cf6',
    '#a78bfa',
    '#c4b5fd',
    '#ddd6fe',
  ],

  // Animacje
  ANIMATION: {
    DURATION_FAST: 150,
    DURATION_NORMAL: 300,
    DURATION_SLOW: 500,
    COUNT_DURATION: 1000,
    STAGGER_DELAY: 100,
  },

  // Toast
  TOAST_DURATION: 3000,

  // Sortowanie domyslne
  DEFAULT_SORT: {
    field: 'sales',
    direction: 'desc',
  },

  // Ile top produktow na wykresie
  TOP_PRODUCTS_COUNT: 5,
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.CONVERSION_THRESHOLDS);
Object.freeze(CONFIG.MARKETS);
Object.freeze(CONFIG.MARKET_COLORS);
Object.freeze(CONFIG.CHART_COLORS);
Object.freeze(CONFIG.ANIMATION);
Object.freeze(CONFIG.DEFAULT_SORT);
