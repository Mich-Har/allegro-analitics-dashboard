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
  SESSION_TIMEOUT_MINUTES: 30,

  // Jak czesto sprawdzac timeout (w sekundach)
  SESSION_CHECK_INTERVAL_SECONDS: 60,

  // ============================================
  // ZRODLO DANYCH - WYBIERZ JEDNO:
  // ============================================

  // OPCJA 1: Webhook n8n (ZALECANE)
  // Wklej URL swojego webhooka z n8n
  WEBHOOK_URL: 'https://n8n-app.coolify.mihara.space/webhook/allegro-analytics',

  // Webhook do aktualizacji nazwy produktu
  // Wysyla POST z JSON: { sygnatura: "...", newName: "..." }
  WEBHOOK_UPDATE_PRODUCT_NAME: 'https://n8n-app.coolify.mihara.space/webhook/bb37ea4d-949c-42d7-b1ee-ace06aea2a0f',

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

  // ============================================
  // PROGI KLASYFIKACJI PRODUKTOW
  // Edytuj wartosci ponizej aby dostosowac klasyfikacje
  // ============================================

  PRODUCT_STATUS: {
    // Ile produktow pokazywac w kazdej karcie statusu
    MAX_PRODUCTS_PER_CARD: 5,

    // === SKALUJ ===
    // Produkt do skalowania - doloz budzet, promuj, kopiuj oferte
    // Warunki: WSZYSTKIE musza byc spelnione
    SCALE: {
      ZNV_MULTIPLIER: 1.3,        // ZNV >= avg_ZNV * 1.3 (wysoki zysk/wyswietlenie)
      CONVERSION_MULTIPLIER: 1.0, // konwersja >= avg_konwersja (stabilna konwersja)
      MIN_VIEWS: 150,             // wyswietlenia >= 150 (wiarygodnosc danych)
      MIN_TRANSACTIONS: 5,        // transakcje >= 5 (wiarygodnosc danych)
    },

    // === OPTYMALIZUJ ===
    // Produkt do optymalizacji - popraw cene, opis, zdjecia
    // Warunki: WSZYSTKIE musza byc spelnione
    OPTIMIZE: {
      VIEWS_PERCENTILE: 40,       // wyswietlenia >= percentyl 70% (duzo ruchu)
      VIEWS_FIXED: 250,           // lub wyswietlenia >= 300 (fallback)
      ZNT_MULTIPLIER: 0.7,        // ZNT < avg_ZNT * 0.7 (niski zysk/transakcja)
      CONVERSION_MULTIPLIER: 0.4, // konwersja >= avg_konwersja * 0.6 (nie dramatyczna)
    },

    // === WYGAS ===
    // Produkt do wygaszenia - uwolnij uwage, budzet, miejsce
    // Warunki: MINIMUM 2 z 3 musza byc spelnione
    PHASE_OUT: {
      ZNV_MULTIPLIER: 0.6,        // ZNV < avg_ZNV * 0.5 (niski zysk/wyswietlenie)
      DRAINAGE_THRESHOLD: 0.1,   // drenaz >= 10% (wysoki drenaz prowizyjny)
      MIN_VIEWS: 200,             // wyswietlenia >= 200 (wiarygodnosc danych)
      MIN_CONDITIONS: 1,          // minimum 2 z 3 warunkow
    },
  },

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
Object.freeze(CONFIG.PRODUCT_STATUS);
Object.freeze(CONFIG.PRODUCT_STATUS.SCALE);
Object.freeze(CONFIG.PRODUCT_STATUS.OPTIMIZE);
Object.freeze(CONFIG.PRODUCT_STATUS.PHASE_OUT);
Object.freeze(CONFIG.ANIMATION);
Object.freeze(CONFIG.DEFAULT_SORT);
