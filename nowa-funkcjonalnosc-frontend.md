# Nowa Funkcjonalność Frontend - Podsumowanie Sprzedaży z Ostatnich 30 Dni

## 🎯 Cel Funkcjonalności

Dodanie nowej sekcji w interfejsie użytkownika, która wyświetla **szczegółowe podsumowanie sprzedaży produktu z ostatnich 30 dni** wraz z rozbiciem na poszczególne aukcje i transakcje. Sekcja ta będzie umieszczona **nad istniejącym widokiem rynków**, tworząc dodatkowy poziom analizy sprzedaży.

---

## 📊 Struktura Danych

### Nowa Sekcja: `summary_last_30_days`

Dodana do każdego produktu (na poziomie sygnatury) jako dodatkowe pole w JSON:

```json
{
  "sygnatura": "HA6.PlastryNaBarkZielone60szt...",
  "product_name": "Plastry Przeciwbólowe Na Barki I Kręgosłup",
  
  "summary_last_30_days": {
    "period_days": 30,
    "total_sold_quantity": 8,
    "total_revenue": 639.76,
    "total_commission_suc": -82.72,
    "total_commission_fsf": 0.00,
    "total_commission": -82.72,
    "total_profit": 557.04,
    "transaction_count": 8,
    "active_offers_count": 4,
    "by_offer": { ... }
  },
  
  "podsumowanie_globalne": { ... },
  "podsumowanie_per_rynek": { ... },
  "aukcje_szczegolowo": { ... }
}
```

---

## 🏗️ Hierarchia UI - 3 Poziomy Rozwijania

### **Poziom 0: Lista Produktów (collapsed)**

```
┌─────────────────────────────────────────────┐
│ 📦 Plastry Przeciwbólowe Na Barki      [▼]  │
├─────────────────────────────────────────────┤
│ 📦 Trenażer Motylek Oporowy            [▼]  │
├─────────────────────────────────────────────┤
│ 📦 Ekspander Dla Mężczyzn              [▼]  │
└─────────────────────────────────────────────┘
```

---

### **Poziom 1: Podsumowanie Produktu (expanded)**

Po kliknięciu na produkt:

```
┌─────────────────────────────────────────────┐
│ 📦 Plastry Przeciwbólowe Na Barki      [▲]  │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📊 OSTATNIE 30 DNI                      │ │  ← NOWA SEKCJA
│ │                                         │ │
│ │ Sprzedano: 8 szt                        │ │
│ │ Przychód: 639.76 PLN                    │ │
│ │ Prowizja SUC: -82.72 PLN                │ │
│ │ Prowizja FSF: 0.00 PLN                  │ │
│ │ Zysk netto: 557.04 PLN                  │ │
│ │ Liczba transakcji: 8                    │ │
│ │ Aktywnych aukcji: 4                     │ │
│ │                                         │ │
│ │ [Pokaż szczegóły per aukcja ▼]          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🌍 RYNKI                                │ │  ← Istniejąca sekcja
│ │ • allegro-pl: 29 sprzedanych            │ │    
│ │ • allegro-cz: 0 sprzedanych             │ │
│ │ [Pokaż szczegóły ▼]                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
🌍 RYNKI: istniejąca sekcja ale widoczna jako summary każdego rynku który można rozwinąć - zamknijmy ja też jako blok summary rynki który można rozwinąć w razie potrzeby.
```

---

### **Poziom 2: Szczegóły Per Aukcja (expanded)**

Po kliknięciu "Pokaż szczegóły per aukcja":

```
┌─────────────────────────────────────────────┐
│ 📊 OSTATNIE 30 DNI                      [▲] │
│                                             │
│ Sprzedano: 8 szt | Zysk: 557.04 PLN        │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🏷️ Aukcja #17773899719              [▼]│ │
│ │ SILNE PLASTRY PRZECIWBÓLOWE...          │ │
│ │                                         │ │
│ │ Sprzedano: 6 szt                        │ │
│ │ Przychód: 479.82 PLN                    │ │
│ │ Prowizja SUC: -62.06 PLN                │ │
│ │ Prowizja FSF: 0.00 PLN                  │ │
│ │ Zysk netto: 417.76 PLN                  │ │
│ │ Transakcji: 6                           │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🏷️ Aukcja #18254068312              [▼]│ │
│ │ PLASTRY PRZECIWBÓLOWE NA KRĘGOSŁUP...   │ │
│ │                                         │ │
│ │ Sprzedano: 1 szt                        │ │
│ │ Przychód: 79.97 PLN                     │ │
│ │ Zysk netto: 69.63 PLN                   │ │
│ │ Transakcji: 1                           │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```


---

## 📈 Wyświetlane Metryki

### **Poziom Produktu (summary_last_30_days - agregat)**

| Metryka | Opis | Źródło | Przykład |
|---------|------|--------|----------|
| `total_sold_quantity` | Suma sprzedanych sztuk | suma `quantity` ze wszystkich transakcji | 8 szt |
| `total_revenue` | Całkowity przychód | suma `total_price` | 639.76 PLN |
| `total_commission_suc` | Prowizja od sprzedaży | suma `commission_suc` | -82.72 PLN |
| `total_commission_fsf` | Prowizja od wyróżnienia | suma `commission_fsf` | 0.00 PLN |
| `total_commission` | Całkowita prowizja | suma `commission_total` | -82.72 PLN |
| `total_profit` | Zysk netto | suma `profit` | 557.04 PLN |
| `transaction_count` | Liczba transakcji | licznik | 8 |
| `active_offers_count` | Aktywne aukcje | liczba `offer_ids` z sold > 0 | 4 |

---

### **Poziom Aukcji (by_offer[offer_id])**

| Metryka | Opis | Źródło | Przykład |
|---------|------|--------|----------|
| `offer_name` | Tytuł aukcji | `Tytuł Aukcji` | "SILNE PLASTRY..." |
| `sold_quantity` | Sprzedane sztuki dla tej aukcji | suma `quantity` | 6 szt |
| `revenue` | Przychód z tej aukcji | suma `total_price` | 479.82 PLN |
| `commission_suc` | Prowizja SUC dla tej aukcji | suma | -62.06 PLN |
| `commission_fsf` | Prowizja FSF dla tej aukcji | suma | 0.00 PLN |
| `profit` | Zysk z tej aukcji | suma | 417.76 PLN |
| `transactions` | Tablica transakcji | szczegóły poniżej | [...] |

---

## 🎨 Design Guidelines

### **Kolory/Oznaczenia**

- ✅ **Zysk dodatni** (zielony): `profit > 0`
- ⚠️ **Zysk zerowy** (żółty): `profit = 0`
- ❌ **Strata** (czerwony): `profit < 0`
- 📊 **Prowizja SUC**: pomarańczowy
- 💎 **Prowizja FSF**: niebieski
- 💰 **Przychód**: zielony

---

### **Sortowanie**

**Domyślne sortowanie produktów:**
- Po zysku netto (malejąco) - najbardziej dochodowe na górze

**Domyślne sortowanie aukcji w ramach produktu:**
- Po liczbie sprzedanych sztuk (malejąco)

**Domyślne sortowanie transakcji:**
- Po dacie (najnowsze na górze)

---

### **Filtry (opcjonalne - przyszłość)**

Użytkownik może chcieć:
- Zmienić okres z 30 dni na: 7 dni, 60 dni, 90 dni, custom
- Filtrować tylko aukcje z prowizją FSF > 0
- Filtrować tylko transakcje powyżej X PLN zysku

---

## 🔄 Integracja z Istniejącymi Sekcjami

### **Kolejność Sekcji (od góry do dołu):**

1. **📊 OSTATNIE 30 DNI** ← NOWA SEKCJA
   - Podsumowanie sprzedaży
   - Szczegóły per aukcja
   - Lista transakcji

2. **🌍 RYNKI** ← Istniejąca sekcja
   - allegro-pl, allegro-cz, etc.
   - Szczegóły per rynek
   - Aukcje per rynek

3. **📈 STATYSTYKI GLOBALNE** ← Istniejąca sekcja
   - Suma wyświetleń
   - Suma obserwujących
   - Stan magazynowy

---

## 📱 Responsywność

### **Desktop:**
- Sekcje obok siebie (2 kolumny)
- Pełne szczegóły widoczne

### **Tablet:**
- Sekcje pod sobą (1 kolumna)
- Szczegóły skrócone

### **Mobile:**
- Minimalistyczny widok
- Tylko kluczowe metryki
- Rozwijanie po kliknięciu

---

## ⚡ Wydajność

### **Lazy Loading:**
- Transakcje ładowane dopiero po rozwinięciu aukcji
- Domyślnie pokazuj tylko 3 pierwsze transakcje
- "Pokaż więcej" jeśli > 3

### **Caching:**
- Cache danych na 5 minut
- Refresh po kliknięciu przycisku "Odśwież"

---

## 🧪 Przypadki Brzegowe

### **Brak transakcji w ostatnich 30 dniach:**
```json
"summary_last_30_days": null
```

**UI:**
```
┌─────────────────────────────────────────────┐
│ 📊 OSTATNIE 30 DNI                          │
│                                             │
│ ℹ️ Brak sprzedaży w ostatnich 30 dniach    │
└─────────────────────────────────────────────┘
```

---



---

### **Brak prowizji FSF (= 0.00):**
- Pokaż jako 0.00 PLN
- Szary kolor (nieaktywne)
- Tooltip: "Brak promowania w tym okresie"

---

## 📊 Metryki Sukcesu

Po wdrożeniu mierzymy:
- Czas spędzony w nowej sekcji (avg)
- % użytkowników rozwijających szczegóły
- Najczęściej oglądane produkty
- Czy użytkownicy wracają do sekcji wielokrotnie

---



## 📄 Przykładowa Struktura JSON (Kompletna)

jest w pliku doc/frontend-json-input-25-01-2026.json
