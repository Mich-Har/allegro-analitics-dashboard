# Komponenty UI

## Przeglad struktury UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HEADER                                          │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │ 📊 Allegro Analytics               │  │ Ostatnia aktualizacja: ...  │  │
│  └─────────────────────────────────────┘  │ [🔄 Odswiez dane]            │  │
│                                           └──────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│                              KPI CARDS                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ 📊         │  │ 👁️        │  │ 🎯         │  │ 🏆         │            │
│  │ 107        │  │ 2,237      │  │ 4.78%      │  │ Top Prod   │            │
│  │ Sprzedaz   │  │ Wyswietl.  │  │ Konwersja  │  │ 45 szt.    │            │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘            │
├─────────────────────────────────────────────────────────────────────────────┤
│                              CHARTS                                          │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐     │
│  │     Top 5 Produktow          │  │      Sprzedaz per Rynek          │     │
│  │ ████████████████   45        │  │         ┌─────────┐              │     │
│  │ ██████████████     38        │  │       ╱    107    ╲             │     │
│  │ █████████          25        │  │      │  sprzedanych │            │     │
│  │ ██████             18        │  │       ╲           ╱             │     │
│  │ ████               12        │  │         └─────────┘              │     │
│  └──────────────────────────────┘  │  🇵🇱 PL 65%  🇨🇿 CZ 20%  ...     │     │
│                                    └──────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────────────────────┤
│  📦 Produkty  [🔍 Szukaj...]                            [Zwin wszystko]     │
├─────────────────────────────────────────────────────────────────────────────┤
│  │ Produkt        │ Wyswietl. │ Sprzedaz │ Konwersja │ Magazyn │ Aukcje │  │
│  ├────────────────┼───────────┼──────────┼───────────┼─────────┼────────┤  │
│  │ Lampa UV...    │    1,234  │  45 szt. │  3.65%   │ 100 szt.│  4/2   │  │
│  │   HA4.Lampa... │           │          │          │         │        │  │
│  ├────────────────┴───────────┴──────────┴───────────┴─────────┴────────┤  │
│  │ ▶ 🇵🇱 Polska [glowny]        45 szt.   1,100 wys.  4.09%  (3 aktywne)│  │
│  │    ▶ Aktywne aukcje (2)                 800 wys.  35 szt.  4.38%    │  │
│  │       #17832199374 [AKTYWNA]                                         │  │
│  │       LAMPA NA GRZYBICE...                                           │  │
│  │       35 sprzedanych | 800 wyswietl. | 79.77 zl                      │  │
│  │    ▶ Zakonczone aukcje (1)              300 wys.  10 szt.  3.33%    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Header

**Plik:** `js/render.js` → `renderHeader()`

**HTML struktura:**
```html
<header id="header">
  <div class="header-content">
    <div class="header-left">
      <div class="logo">
        <div class="logo-icon animate-pulse">📊</div>
        <h1 class="logo-text title-gradient">Allegro Analytics</h1>
      </div>
    </div>
    <div class="header-right">
      <span class="header-meta">Ostatnia aktualizacja: 19.01.2026, 14:30</span>
      <button id="refreshBtn" class="btn btn-primary">
        <span class="icon refresh-icon">🔄</span>
        <span class="btn-text">Odswiez dane</span>
      </button>
    </div>
  </div>
</header>
```

**Interakcje:**
- Klik "Odswiez dane" → `handleRefresh()` → ponowne ladowanie danych

---

## 2. KPI Cards

**Plik:** `js/render.js` → `renderKPICards(kpis)`

**4 kafelki:**

| Kafelek | Ikona | Wartosc | Zrodlo |
|---------|-------|---------|--------|
| Calkowita Sprzedaz | 📊 | liczba | `kpis.totalSales` |
| Calkowite Wyswietlenia | 👁️ | liczba | `kpis.totalViews` |
| Srednia Konwersja | 🎯 | procent | `kpis.avgConversion` |
| Top Produkt | 🏆 | tekst | `kpis.topProduct.product_name` |

**HTML struktura kafelka:**
```html
<div class="kpi-card animate-fadeIn stagger-1" data-accent="success">
  <div class="kpi-icon">📊</div>
  <div class="kpi-value" data-value="107" data-format="number">107</div>
  <div class="kpi-label">Calkowita Sprzedaz</div>
</div>
```

**Animacja licznikow:**
- Przy ladowaniu strony - animowane liczenie od 0
- Funkcja: `animateKPINumbers()` → `animateValue()`

**Kolorowanie (data-accent):**
- `success` - zielony (sprzedaz)
- `info` - niebieski (wyswietlenia)
- `warning` - zolty (konwersja)
- `secondary` - fioletowy (top produkt)

---

## 3. Wykresy

### 3.1 Bar Chart - Top 5 Produktow

**Plik:** `js/charts.js` → `renderBarChart()`

**Dane:** `prepareBarChartData(topProducts)`
```javascript
[
  { label: "Produkt A", value: 45 },
  { label: "Produkt B", value: 38 },
  // ...
]
```

**Cechy:**
- Horizontal bars
- Gradient fill
- Animowany wzrost (barGrowWidth)
- Pelna nazwa produktu nad paskiem

### 3.2 Donut Chart - Rynki

**Plik:** `js/charts.js` → `renderDonutChart()`

**Dane:** `prepareDonutChartData(markets)`
```javascript
[
  { id: "allegro-pl", label: "Polska", flag: "🇵🇱", value: 65, color: "#ef4444" },
  // ...
]
```

**Cechy:**
- CSS `conic-gradient`
- Dziura w srodku z suma
- Legenda pod wykresem
- Kolory z `CONFIG.MARKET_COLORS`

---

## 4. Tabela produktow

**Plik:** `js/render.js` → `renderProductsTable()`

### 4.1 Kontrolki tabeli

Umieszczone w headerze sekcji (index.html):
```html
<div class="table-header">
  <div>
    <h2 class="table-title">📦 Produkty</h2>
    <input type="text" id="productSearch" placeholder="Szukaj...">
  </div>
  <button id="collapseAllBtn">Zwin wszystko</button>
</div>
```

**Interakcje:**
- Input → `handleSearch()` (debounce 300ms)
- Button → `handleCollapseAll()`

### 4.2 Naglowki kolumn

| Kolumna | Sortowalna | Pole sortowania |
|---------|------------|-----------------|
| Produkt | Tak | `name` (sygnatura) |
| Wyswietlenia | Tak | `views` |
| Sprzedaz | Tak | `sales` |
| Konwersja | Tak | `conversion` |
| Magazyn | Tak | `stock` |
| Aukcje | Nie | - |

**Interakcja:** Klik naglowka → `handleSort(field)`

### 4.3 Wiersz produktu

**Plik:** `js/render.js` → `renderProductRow()`

**Wyswietlane dane (tylko z AKTYWNYCH aukcji):**

| Kolumna | Wartosc | Zrodlo |
|---------|---------|--------|
| Produkt | Nazwa + sygnatura | `product_name`, `sygnatura` |
| Wyswietlenia | liczba | Suma `wyswietlen` z aktywnych aukcji |
| Sprzedaz | X szt. | Suma `sprzedanych` z aktywnych aukcji |
| Konwersja | X.XX% | (sprzedaz/wyswietlenia)*100 z aktywnych |
| Magazyn | X szt. | `stan_magazynowy_wspolny` |
| Aukcje | X/Y | aktywne/zakonczone |

**Klasy warunkowe:**
- `.product-inactive` - brak aktywnych aukcji (opacity: 0.5)
- `.text-danger` - magazyn < 10 szt.

**Badge konwersji:**
- `badge-success` - konwersja >= 0.5%
- `badge-warning` - konwersja 0.1-0.5%
- `badge-danger` - konwersja < 0.1%
- `badge-neutral` - brak aktywnych aukcji

**Interakcja:** Klik wiersza → `handleProductExpand(sygnatura)`

---

## 5. Drill-down produktu

### 5.1 Sekcja rynku

**Plik:** `js/render.js` → `renderProductDetails()`

**Wyswietlane dane (tylko z AKTYWNYCH aukcji danego rynku):**

```
▶ 🇵🇱 Polska [glowny]    45 szt.   1,100 wys.   4.09%   (3 aktywne)
     ↑           ↑           ↑          ↑          ↑          ↑
   ikona      flaga+nazwa  badge    wyswietlenia konwersja  liczba
                          sprzedaz   (zolte)                 aukcji
```

| Element | Zrodlo |
|---------|--------|
| Flaga | `CONFIG.MARKETS[marketId].flag` |
| Nazwa | `CONFIG.MARKETS[marketId].name` |
| [glowny] | `marketData.rynek_glowny` |
| Sprzedaz | `suma_sprzedanych` z `podsumowanie_per_rynek` |
| Wyswietlenia | Suma z aktywnych aukcji |
| Konwersja | (sprzedaz/wyswietlenia)*100 z aktywnych |
| Liczba aukcji | Tylko aktywne aukcje |

**Interakcja:** Klik naglowka rynku → `handleMarketExpand()`

### 5.2 Grupy aukcji

**Plik:** `js/render.js` → `renderGroupedAuctions()`

**Dwie grupy:**
1. **Aktywne aukcje** (zielony naglowek)
2. **Zakonczone aukcje** (szary naglowek)

**Naglowek grupy:**
```
▶ Aktywne aukcje (3)                    800 wys.  |  35 szt.  |  4.38%
```

| Element | Opis |
|---------|------|
| Ikona ▶/▼ | Toggle expand |
| Nazwa | "Aktywne aukcje" / "Zakonczone aukcje" |
| (3) | Liczba aukcji w grupie |
| Wyswietlenia | Suma z aukcji w grupie |
| Sprzedaz | Suma z aukcji w grupie |
| Konwersja | (sprzedaz/wyswietlenia)*100 |

**Interakcja:** Klik naglowka grupy → `handleAuctionGroupExpand()`

### 5.3 Pojedyncza aukcja

**Plik:** `js/render.js` → `renderAuctionItem()`

```
#17832199374 [AKTYWNA]
LAMPA NA GRZYBICE PAZNOKCIA DOMOWA KURACJA PRZECIW GRZYBICY LASER CZARNA
35 sprzedanych | 800 wyswietl. | 79.77 zl                      [Otworz]
```

| Element | Zrodlo |
|---------|--------|
| ID | `auction.id` |
| Status badge | `auction.status` ("ACTIVE"→zielony, "ENDED"→szary) |
| Nazwa | `auction.nazwa` (truncate 60 znakow) |
| Sprzedanych | `auction.sprzedanych` |
| Wyswietl. | `auction.wyswietlen` |
| Cena | `auction.cena` + " zl" |
| Link | `auction.link` (otwarcie w nowej karcie) |

---

## 6. Komponenty pomocnicze

### 6.1 Badge

```html
<span class="badge badge-success">AKTYWNA</span>
<span class="badge badge-neutral">ZAKONCZONA</span>
<span class="badge badge-danger">0.05%</span>
```

**Warianty:**
- `badge-success` - zielony
- `badge-warning` - zolty
- `badge-danger` - czerwony
- `badge-info` - niebieski
- `badge-neutral` - szary

### 6.2 Toast

**Plik:** `js/render.js` → `renderToast(message, type)`

```html
<div class="toast toast-success">
  <span class="toast-icon">✅</span>
  <div class="toast-content">
    <div class="toast-title">Sukces</div>
    <div class="toast-message">Dane odswiezone pomyslnie!</div>
  </div>
</div>
```

**Typy:** `success`, `error`
**Czas wyswietlania:** `CONFIG.TOAST_DURATION` (3000ms)

### 6.3 Skeleton Loading

**Plik:** `js/render.js` → `renderSkeletons()`

Wyswietlane podczas ladowania danych:
- KPI cards: szare prostokaty
- Wykresy: szare prostokaty
- Tabela: szare linie

### 6.4 Error State

**Plik:** `js/render.js` → `renderError(message)`

Wyswietlane gdy ladowanie danych sie nie powiedzie:
```
❌
Blad ladowania danych
[komunikat bledu]
[Sprobuj ponownie]
```
