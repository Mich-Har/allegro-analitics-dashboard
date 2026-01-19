# Architektura systemu

## Diagram przeplywu danych

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ZRODLO DANYCH                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐         ┌──────────────┐                                 │
│   │  Allegro API │ ──────► │     n8n      │                                 │
│   │  (zewnetrzne)│         │  (workflow)  │                                 │
│   └──────────────┘         └──────┬───────┘                                 │
│                                   │                                          │
│                                   ▼                                          │
│                          ┌───────────────┐                                  │
│                          │    Webhook    │                                  │
│                          │  lub plik    │                                   │
│                          │    .txt       │                                  │
│                          └───────┬───────┘                                  │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Browser)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │                        js/config.js                               │      │
│   │  - WEBHOOK_URL / DATA_FILE                                        │      │
│   │  - MARKETS mapping                                                │      │
│   │  - CONVERSION_THRESHOLDS                                          │      │
│   │  - CHART_COLORS                                                   │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                   │                                          │
│                                   ▼                                          │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │                        js/data.js                                 │      │
│   │                                                                   │      │
│   │  loadData()          - Fetch z webhook/pliku                      │      │
│   │       │                                                           │      │
│   │       ▼                                                           │      │
│   │  processData()       - Filtrowanie blacklisty                     │      │
│   │       │              - Agregacja rynkow                           │      │
│   │       │              - Obliczanie KPI                             │      │
│   │       │              - Wybor top produktow                        │      │
│   │       ▼                                                           │      │
│   │  processedData = {                                                │      │
│   │    products: [...],                                               │      │
│   │    markets: {...},                                                │      │
│   │    kpis: {...},                                                   │      │
│   │    topProducts: [...]                                             │      │
│   │  }                                                                │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                   │                                          │
│                                   ▼                                          │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │                        js/render.js                               │      │
│   │                                                                   │      │
│   │  renderDashboard()   - Glowna funkcja renderujaca                 │      │
│   │       │                                                           │      │
│   │       ├── renderHeader()        - Naglowek z data                 │      │
│   │       ├── renderKPICards()      - 4 kafelki KPI                   │      │
│   │       ├── renderCharts()        - Wykresy                         │      │
│   │       └── renderProductsTable() - Tabela produktow                │      │
│   │               │                                                   │      │
│   │               ├── renderProductRow()     - Wiersz produktu        │      │
│   │               ├── renderProductDetails() - Drill-down rynkow      │      │
│   │               └── renderGroupedAuctions()- Lista aukcji           │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                   │                                          │
│                                   ▼                                          │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │                        js/charts.js                               │      │
│   │                                                                   │      │
│   │  renderBarChart()    - Horizontal bar chart (top 5)               │      │
│   │  renderDonutChart()  - Donut chart (rynki)                        │      │
│   │  prepareBarChartData()                                            │      │
│   │  prepareDonutChartData()                                          │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                   │                                          │
│                                   ▼                                          │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │                        js/main.js                                 │      │
│   │                                                                   │      │
│   │  Stan aplikacji:                                                  │      │
│   │  - currentSort                                                    │      │
│   │  - currentSearchQuery                                             │      │
│   │  - expandedProducts (Set)                                         │      │
│   │                                                                   │      │
│   │  Event Handlers:                                                  │      │
│   │  - handleRefresh()          - Odswiezanie danych                  │      │
│   │  - handleSort()             - Sortowanie tabeli                   │      │
│   │  - handleSearch()           - Wyszukiwanie (debounce 300ms)       │      │
│   │  - handleProductExpand()    - Rozwijanie produktow                │      │
│   │  - handleMarketExpand()     - Rozwijanie rynkow                   │      │
│   │  - handleAuctionGroupExpand() - Rozwijanie grup aukcji            │      │
│   │  - handleCollapseAll()      - Zwijanie wszystkiego                │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Moduly JavaScript

### 1. config.js

**Cel:** Centralna konfiguracja aplikacji.

**Eksportuje:** Obiekt `CONFIG` (zamrozony przez `Object.freeze`)

**Kluczowe pola:**

| Pole | Typ | Opis |
|------|-----|------|
| `WEBHOOK_URL` | string | URL webhooka n8n |
| `DATA_FILE` | string | Sciezka do pliku lokalnego |
| `DATA_SOURCE` | 'webhook' \| 'file' | Wybor zrodla danych |
| `BLACKLIST_SIGNATURES` | string[] | Sygnatury do pominiecia |
| `MARKETS` | object | Mapowanie ID rynku na nazwe/flage/kod |
| `CONVERSION_THRESHOLDS` | object | Progi dla kolorowania konwersji |
| `MARKET_COLORS` | object | Kolory dla wykresow per rynek |

---

### 2. data.js

**Cel:** Ladowanie, przetwarzanie i transformacja danych.

**Zmienne globalne:**
- `rawData` - surowe dane z API/pliku
- `processedData` - przetworzone dane gotowe do renderowania

**Funkcje:**

| Funkcja | Wejscie | Wyjscie | Opis |
|---------|---------|---------|------|
| `loadData()` | - | Promise<processedData> | Laduje dane z webhook/pliku |
| `processData(data)` | rawData[] | processedData | Przetwarza surowe dane |
| `aggregateMarkets(products)` | products[] | markets{} | Agreguje dane per rynek |
| `calculateKPIs(products, markets)` | products[], markets | kpis{} | Oblicza metryki KPI |
| `getTopProducts(products, count)` | products[], number | products[] | Top N produktow |
| `sortProducts(products, field, dir)` | products[], string, string | products[] | Sortuje produkty |
| `filterProducts(products, filters)` | products[], filters | products[] | Filtruje produkty |
| `getProductConversion(product)` | product | number | Konwersja produktu (%) |
| `getConversionStatus(conversion)` | number | {class, color, label} | Status konwersji |
| `getBestMarket(product)` | product | market \| null | Najlepszy rynek |
| `formatNumber(num)` | number | string | Formatowanie liczb (1 234) |
| `formatPercent(num)` | number | string | Formatowanie % (1.23%) |

---

### 3. render.js

**Cel:** Renderowanie komponentow UI do DOM.

**Funkcje:**

| Funkcja | Opis |
|---------|------|
| `renderDashboard(data)` | Glowna funkcja - renderuje caly dashboard |
| `renderHeader()` | Naglowek z logo i przyciskiem odswiezania |
| `renderKPICards(kpis)` | 4 kafelki KPI |
| `renderCharts(topProducts, markets)` | Sekcja wykresow |
| `renderProductsTable(products, sortField, sortDir, searchQuery)` | Tabela produktow |
| `renderProductRow(product, index, maxSales, maxViews)` | Pojedynczy wiersz produktu |
| `renderProductDetails(product)` | Szczegoly produktu (drill-down) |
| `renderGroupedAuctions(auctionsList)` | Grupy aukcji (aktywne/zakonczone) |
| `renderAuctionItem(auction)` | Pojedyncza aukcja |
| `renderSkeletons()` | Skeleton loading |
| `renderToast(message, type)` | Notyfikacje toast |
| `renderError(message)` | Ekran bledu |

---

### 4. charts.js

**Cel:** Generowanie wykresow (bez zewnetrznych bibliotek).

**Funkcje:**

| Funkcja | Opis |
|---------|------|
| `renderBarChart(container, data, options)` | Horizontal bar chart |
| `renderDonutChart(container, data, options)` | Donut chart (conic-gradient) |
| `prepareBarChartData(products)` | Przygotowanie danych dla bar chart |
| `prepareDonutChartData(markets)` | Przygotowanie danych dla donut |
| `truncateText(text, maxLength)` | Obcinanie tekstu |
| `adjustColor(color, amount)` | Rozjasnianie/przyciemnianie koloru |

---

### 5. main.js

**Cel:** Logika glowna, inicjalizacja i event handlers.

**Stan aplikacji:**

```javascript
let currentSort = { field: 'sales', direction: 'desc' };
let currentFilters = {};
let expandedProducts = new Set();
let currentSearchQuery = '';
let searchDebounceTimer = null;
```

**Event Handlers:**

| Handler | Trigger | Akcja |
|---------|---------|-------|
| `handleRefresh()` | Klik "Odswiez dane" | Ponowne ladowanie danych |
| `handleSort(field)` | Klik naglowka kolumny | Sortowanie tabeli |
| `handleSearch(query)` | Input w searchbox | Filtrowanie (debounce 300ms) |
| `handleProductExpand(sygnatura)` | Klik wiersza produktu | Toggle rozwinieicia |
| `handleMarketExpand(header)` | Klik naglowka rynku | Toggle aukcji rynku |
| `handleAuctionGroupExpand(header)` | Klik grupy aukcji | Toggle listy aukcji |
| `handleCollapseAll()` | Klik "Zwin wszystko" | Zwiniecie wszystkiego |

---

## Pliki CSS

### variables.css
- Zmienne kolorow (--primary, --success, --danger, etc.)
- Zmienne typografii (--font-main, --font-mono)
- Zmienne spacing (--space-xs, --space-s, etc.)
- Zmienne cieni i przejsc

### animations.css
- Keyframes (fadeIn, slideDown, pulse, spin)
- Klasy animacji (animate-fadeIn, animate-pulse)
- Stagger delays

### components.css
- Przyciski (.btn, .btn-primary, .btn-secondary)
- Badge (.badge, .badge-success, .badge-danger)
- Karty KPI (.kpi-card)
- Toast notyfikacje

### layout.css
- Header (.header-content)
- Grid layout (.kpi-grid, .charts-grid)
- Tabela produktow (.products-table)
- Expanded rows (.expanded-content)
- Market sections (.market-section)

---

## Cykl zycia aplikacji

```
1. DOMContentLoaded
   │
   ├── renderSkeletons()     // Pokaz loading state
   │
   ├── loadData()            // Fetch danych
   │   ├── fetch(webhook/file)
   │   └── processData()
   │       ├── filter blacklist
   │       ├── aggregateMarkets()
   │       ├── calculateKPIs()
   │       └── getTopProducts()
   │
   ├── renderDashboard()     // Renderuj UI
   │   ├── renderHeader()
   │   ├── renderKPICards()
   │   ├── renderCharts()
   │   └── renderProductsTable()
   │
   ├── animateKPINumbers()   // Animacje licznikow
   │
   └── attachEventListeners() // Podepnij eventy
       ├── click: refresh
       ├── click: sort
       ├── click: expand product
       ├── click: expand market
       ├── click: expand auction group
       ├── click: collapse all
       └── input: search (debounce)
```

---

## Zaleznosci miedzy modulami

```
index.html
    │
    ├── css/variables.css
    ├── css/animations.css
    ├── css/components.css
    ├── css/layout.css
    │
    ├── js/config.js      ◄── Brak zaleznosci
    │       │
    ├── js/data.js        ◄── Wymaga: CONFIG
    │       │
    ├── js/charts.js      ◄── Wymaga: CONFIG, formatNumber
    │       │
    ├── js/render.js      ◄── Wymaga: CONFIG, data.js functions, charts.js
    │       │
    └── js/main.js        ◄── Wymaga: wszystkie powyzsze
```

**Uwaga:** Kolejnosc ladowania skryptow w index.html jest wazna!
