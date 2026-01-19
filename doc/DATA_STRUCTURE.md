# Struktura danych wejsciowych

## Przeglad

Dane wejsciowe to tablica obiektow JSON, gdzie kazdy obiekt reprezentuje **jeden produkt** z wszystkimi jego aukcjami na roznych rynkach Allegro.

**Zrodlo danych:** n8n webhook lub plik lokalny (`final_output_for_frontend.txt`)

---

## Struktura JSON - Produkt

```json
{
  "sygnatura": "string",
  "product_name": "string",
  "podsumowanie_globalne": { ... },
  "podsumowanie_per_rynek": { ... },
  "aukcje_szczegolowo": { ... }
}
```

### Pola glowne

| Pole | Typ | Opis | Przyklad |
|------|-----|------|----------|
| `sygnatura` | string | Unikalny identyfikator produktu (SKU wewnetrzny) | `"HA4.LampaCzarnaUV.GabarytA.Ufel"` |
| `product_name` | string | Czytelna nazwa produktu | `"Lampa UV Do Terapii Grzybicy"` |
| `podsumowanie_globalne` | object | Zagregowane dane ze wszystkich rynkow | Zobacz nizej |
| `podsumowanie_per_rynek` | object | Dane podzielone per rynek | Zobacz nizej |
| `aukcje_szczegolowo` | object | Szczegoly pojedynczych aukcji per rynek | Zobacz nizej |

---

## podsumowanie_globalne

Zagregowane metryki ze **wszystkich rynkow i aukcji** dla danego produktu.

```json
{
  "podsumowanie_globalne": {
    "suma_sprzedanych_total": 2,
    "suma_wyswietlen_total": 91,
    "suma_obserwujacych_total": 16,
    "liczba_aukcji_total": 3,
    "stan_magazynowy_wspolny": 1
  }
}
```

| Pole | Typ | Opis | Skad pochodzi |
|------|-----|------|---------------|
| `suma_sprzedanych_total` | number | Laczna liczba sprzedanych sztuk | Suma ze wszystkich aukcji |
| `suma_wyswietlen_total` | number | Laczna liczba wyswietlen | Suma ze wszystkich aukcji |
| `suma_obserwujacych_total` | number | Laczna liczba obserwujacych | Suma ze wszystkich aukcji |
| `liczba_aukcji_total` | number | Calkowita liczba aukcji | Zliczenie wszystkich aukcji |
| `stan_magazynowy_wspolny` | number | Wspolny stan magazynowy | Z systemu magazynowego |

**Uwaga:** Te dane obejmuja WSZYSTKIE aukcje (aktywne + zakonczone). W dashboardzie dla tabeli produktow uzywamy danych tylko z **aktywnych aukcji**.

---

## podsumowanie_per_rynek

Dane zagregowane dla kazdego rynku osobno.

```json
{
  "podsumowanie_per_rynek": {
    "allegro-pl": {
      "rynek_glowny": true,
      "suma_sprzedanych": 2,
      "suma_wyswietlen": 91,
      "suma_obserwujacych": 16,
      "liczba_aukcji": 3,
      "waluta": "PLN"
    },
    "allegro-cz": {
      "rynek_glowny": false,
      "suma_sprzedanych": 1,
      "suma_wyswietlen": 11,
      "suma_obserwujacych": 1,
      "liczba_aukcji": 1,
      "waluta": "CZK"
    }
    // ... inne rynki
  }
}
```

| Pole | Typ | Opis |
|------|-----|------|
| `rynek_glowny` | boolean | Czy to glowny rynek dla produktu |
| `suma_sprzedanych` | number | Sprzedane na tym rynku |
| `suma_wyswietlen` | number | Wyswietlenia na tym rynku |
| `suma_obserwujacych` | number | Obserwujacy na tym rynku |
| `liczba_aukcji` | number | Liczba aukcji na tym rynku |
| `waluta` | string | Waluta rynku (PLN, CZK, EUR, HUF) |

### Dostepne ID rynkow (Allegro)

| ID | Nazwa | Waluta | Flaga |
|----|-------|--------|-------|
| `allegro-pl` | Polska | PLN | 🇵🇱 |
| `allegro-cz` | Czechy | CZK | 🇨🇿 |
| `allegro-sk` | Slowacja | EUR | 🇸🇰 |
| `allegro-hu` | Wegry | HUF | 🇭🇺 |
| `allegro-business-pl` | B2B Polska | PLN | (brak) |
| `allegro-business-cz` | B2B Czechy | CZK | (brak) |

---

## aukcje_szczegolowo

Szczegolowe dane kazdej pojedynczej aukcji, pogrupowane per rynek.

```json
{
  "aukcje_szczegolowo": {
    "allegro-pl": [
      {
        "id": "17832199374",
        "nazwa": "LAMPA NA GRZYBICE PAZNOKCIA DOMOWA KURACJA...",
        "sprzedanych": 1,
        "wyswietlen": 50,
        "obserwujacych": 6,
        "cena": "79.77",
        "status": "ENDED",
        "data_startu": "2025-08-26T13:00:35.000Z",
        "link": "https://allegro.pl/oferta/17832199374"
      },
      {
        "id": "17832186663",
        "nazwa": "LAMPA NA GRZYBICE PAZNOKCIA TERAPIA SWIATLEM...",
        "sprzedanych": 0,
        "wyswietlen": 14,
        "obserwujacych": 2,
        "cena": "79.77",
        "status": "ACTIVE",
        "data_startu": "2025-08-26T13:00:35.000Z",
        "link": "https://allegro.pl/oferta/17832186663"
      }
    ],
    "allegro-cz": [ ... ]
  }
}
```

| Pole | Typ | Opis |
|------|-----|------|
| `id` | string | ID aukcji na Allegro |
| `nazwa` | string | Tytul aukcji |
| `sprzedanych` | number | Liczba sprzedanych sztuk |
| `wyswietlen` | number | Liczba wyswietlen aukcji |
| `obserwujacych` | number | Liczba obserwujacych |
| `cena` | string | Cena w walucie rynku |
| `status` | string | `"ACTIVE"` lub `"ENDED"` |
| `data_startu` | string | Data rozpoczecia (ISO 8601) |
| `link` | string | URL do aukcji |

---

## Przetwarzanie danych w dashboardzie

### 1. Ladowanie danych (`loadData()`)

```javascript
// Webhook
const response = await fetch(CONFIG.WEBHOOK_URL);
let jsonData = await response.json();

// n8n zwraca format: [{ json: {...} }, { json: {...} }]
if (jsonData[0].json) {
  jsonData = jsonData.map(item => item.json);
}
```

### 2. Filtrowanie (`processData()`)

```javascript
// Usuniecie produktow z blacklisty
const filtered = data.filter(p =>
  !CONFIG.BLACKLIST_SIGNATURES.includes(p.sygnatura)
);

// Opcjonalne: minimum wyswietlen
const products = filtered.filter(p =>
  p.podsumowanie_globalne.suma_wyswietlen_total >= CONFIG.MIN_VIEWS_FOR_LISTING
);
```

### 3. Agregacja rynkow (`aggregateMarkets()`)

```javascript
// Dla kazdego produktu, dla kazdego rynku - sumuj metryki
markets[marketId].totalSales += marketData.suma_sprzedanych;
markets[marketId].totalViews += marketData.suma_wyswietlen;
// ...
```

### 4. Obliczanie metryk dla tabeli produktow

**WAZNE:** Tabela produktow pokazuje dane **tylko z aktywnych aukcji**:

```javascript
// Pobierz wszystkie aukcje
const allAuctions = Object.values(product.aukcje_szczegolowo).flat();

// Filtruj tylko aktywne
const activeAuctions = allAuctions.filter(a => a.status === 'ACTIVE');

// Oblicz metryki z aktywnych
const activeViews = activeAuctions.reduce((sum, a) => sum + a.wyswietlen, 0);
const activeSales = activeAuctions.reduce((sum, a) => sum + a.sprzedanych, 0);
const activeConversion = activeViews > 0 ? (activeSales / activeViews) * 100 : 0;
```

---

## Transformacja danych - schemat

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INPUT: rawData[]                              │
│  Array produktow z Allegro API                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      processData(rawData)                            │
│                                                                      │
│  1. Filtruj blackliste                                               │
│  2. Filtruj min. wyswietlen                                          │
│  3. aggregateMarkets() → markets{}                                   │
│  4. calculateKPIs() → kpis{}                                         │
│  5. getTopProducts() → topProducts[]                                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      OUTPUT: processedData                           │
│                                                                      │
│  {                                                                   │
│    products: [...],      // Przefiltrowane produkty                  │
│    markets: {            // Zagregowane dane per rynek               │
│      'allegro-pl': { totalSales, totalViews, conversion, ... },     │
│      'allegro-cz': { ... }                                          │
│    },                                                                │
│    kpis: {               // Glowne metryki                           │
│      totalSales,                                                     │
│      totalViews,                                                     │
│      avgConversion,                                                  │
│      topProduct,                                                     │
│      productCount,                                                   │
│      marketCount                                                     │
│    },                                                                │
│    topProducts: [...]    // Top 5 produktow                          │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Przyklad pelnego obiektu produktu

```json
{
  "sygnatura": "HA4.LampaCzarnaUVdoGrzybicyPaznokci.GabarytA.Ufel",
  "product_name": "Lampa UV Do Terapii Grzybicy Paznokci",

  "podsumowanie_globalne": {
    "suma_sprzedanych_total": 2,
    "suma_wyswietlen_total": 91,
    "suma_obserwujacych_total": 16,
    "liczba_aukcji_total": 3,
    "stan_magazynowy_wspolny": 1
  },

  "podsumowanie_per_rynek": {
    "allegro-pl": {
      "rynek_glowny": true,
      "suma_sprzedanych": 2,
      "suma_wyswietlen": 91,
      "suma_obserwujacych": 16,
      "liczba_aukcji": 3,
      "waluta": "PLN"
    },
    "allegro-cz": {
      "rynek_glowny": false,
      "suma_sprzedanych": 1,
      "suma_wyswietlen": 11,
      "suma_obserwujacych": 1,
      "liczba_aukcji": 1,
      "waluta": "CZK"
    }
  },

  "aukcje_szczegolowo": {
    "allegro-pl": [
      {
        "id": "17832199374",
        "nazwa": "LAMPA NA GRZYBICE PAZNOKCIA DOMOWA KURACJA PRZECIW GRZYBICY LASER CZARNA",
        "sprzedanych": 1,
        "wyswietlen": 50,
        "obserwujacych": 6,
        "cena": "79.77",
        "status": "ENDED",
        "data_startu": "2025-08-26T13:00:35.000Z",
        "link": "https://allegro.pl/oferta/17832199374"
      },
      {
        "id": "17832186663",
        "nazwa": "LAMPA NA GRZYBICE PAZNOKCIA TERAPIA SWIATLEM URZADZENIE FOTOTERAPIA DOMOWA",
        "sprzedanych": 0,
        "wyswietlen": 14,
        "obserwujacych": 2,
        "cena": "79.77",
        "status": "ACTIVE",
        "data_startu": "2025-08-26T13:00:35.000Z",
        "link": "https://allegro.pl/oferta/17832186663"
      }
    ],
    "allegro-cz": [
      {
        "id": "17832127935",
        "nazwa": "LAMPA NA GRZYBICE PAZNOKCIA LASER DO GRZYBICY TERAPIA SWIATLEM NIEBIESKIM",
        "sprzedanych": 1,
        "wyswietlen": 11,
        "obserwujacych": 1,
        "cena": "513.0",
        "status": "ENDED",
        "data_startu": "2025-08-26T13:00:35.000Z",
        "link": "https://allegro.pl/oferta/17832127935"
      }
    ]
  }
}
```
