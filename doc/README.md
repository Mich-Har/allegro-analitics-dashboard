# Allegro Analytics Dashboard - Dokumentacja Techniczna

## Spis tresci

1. [Architektura systemu](./ARCHITECTURE.md)
2. [Struktura danych wejsciowych](./DATA_STRUCTURE.md)
3. [Komponenty UI](./COMPONENTS.md)
4. [Konfiguracja](./CONFIGURATION.md)
5. [Formuly i obliczenia](./FORMULAS.md)
6. [Plan rozwoju - Multi-Marketplace](./ROADMAP.md)

---

## Przeglad projektu

**Allegro Analytics Dashboard** to aplikacja webowa do wizualizacji i analizy danych sprzedazowych z platformy Allegro. Dashboard prezentuje kluczowe metryki (KPI), wykresy oraz szczegolowa liste produktow z mozliwoscia drill-down do poziomu pojedynczych aukcji.

### Glowne funkcjonalnosci

- **KPI Cards** - 4 kafelki z kluczowymi metrykami (sprzedaz, wyswietlenia, konwersja, top produkt)
- **Wykresy** - Bar chart (top 5 produktow), Donut chart (rozklad sprzedazy per rynek)
- **Tabela produktow** - Lista wszystkich produktow z sortowaniem i wyszukiwaniem
- **Drill-down** - Rozwijanie produktow do poziomu rynkow i pojedynczych aukcji
- **Filtrowanie** - Wyszukiwanie po nazwie/sygnaturze produktu

### Stack technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Frontend | Vanilla JavaScript (ES6+) |
| Styling | CSS3 z zmiennymi (CSS Custom Properties) |
| Wykresy | Czyste CSS (conic-gradient) + HTML |
| Dane | JSON via Fetch API |
| Backend danych | n8n webhook lub plik lokalny |

### Struktura katalogow

```
Testallegro/
├── index.html              # Glowny plik HTML
├── css/
│   ├── variables.css       # Zmienne CSS (kolory, fonty, spacing)
│   ├── animations.css      # Animacje i keyframes
│   ├── components.css      # Style komponentow (karty, badge, przyciski)
│   └── layout.css          # Layout (header, grid, tabela)
├── js/
│   ├── config.js           # Konfiguracja (URL, progi, mapowania)
│   ├── data.js             # Ladowanie i przetwarzanie danych
│   ├── render.js           # Renderowanie komponentow UI
│   ├── charts.js           # Wykresy (bar, donut)
│   └── main.js             # Logika glowna i event handlers
├── doc/                    # Dokumentacja techniczna
└── final_output_for_frontend.txt  # Przykladowe dane testowe
```

### Uruchomienie

```bash
# Opcja 1: Python
python -m http.server 8000

# Opcja 2: Node.js
npx serve .

# Opcja 3: PHP
php -S localhost:8000
```

Nastepnie otworz `http://localhost:8000` w przegladarce.

---

## Szybki start dla deweloperow

### 1. Zrozumienie przepływu danych

```
[n8n/Allegro API] → [Webhook/Plik] → [data.js: loadData()] → [processData()] → [render.js] → [UI]
```

### 2. Kluczowe pliki do modyfikacji

| Zadanie | Plik |
|---------|------|
| Dodanie nowego rynku | `js/config.js` (MARKETS, MARKET_COLORS) |
| Zmiana obliczen KPI | `js/data.js` (calculateKPIs) |
| Modyfikacja tabeli | `js/render.js` (renderProductRow) |
| Stylowanie | `css/variables.css`, `css/components.css` |

### 3. Debugowanie

Otwórz konsole przegladarki (F12) - dane sa logowane:
- `KPI Debug:` - wartosci totalSales, totalViews
- `Avg Conversion:` - obliczona konwersja

---

## Kontakt i wsparcie

Dokumentacja stworzona: Styczen 2026
Wersja: 1.0.0
