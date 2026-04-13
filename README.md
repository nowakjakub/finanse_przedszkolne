# 🦆 Kaczuszki Skarbiec

Transparentne zarządzanie finansami grupy przedszkolnej Kaczuszki dla rodziców.

## 🌐 Demo

Strona dostępna na: https://nowakjakub.github.io/kaczuszki-skarbiec/

## ✨ Funkcjonalności

- **💰 Stan skarbca** - podsumowanie bilansowe (wpłaty, inne wpływy, wydatki)
- **🎁 Nasze zbiórki** - aktywne i zamknięte zbiórki ze statusem płatności
- **👶 Czy zapłaciliśmy?** - szybka weryfikacja zaległości dziecka
- **🏦 Jak przelać pieniążki?** - dane bankowe, BLIK, Revolut z kopiowaniem
- **🎉 Co nas czeka?** - nadchodzące wydarzenia z bannerem 5-dniowym
- **📊 Gdzie idą pieniążki?** - szczegóło wydatków z paragonami
- **🌙 Przełącznik motywu** - automatyczne wykrywanie preferencji systemu

## 🎨 Cechy

- ✅ **100% statyczne** - hosting na GitHub Pages
- ✅ **Brak frameworków** - vanilla JavaScript (IIFE)
- ✅ **Responsywne** - działa na komputerze, tablecie, telefonie
- ✅ **Motyw kaczuszek** - żółte i pomarańczowe kolory (jasny/ciemny)
- ✅ **Przyjazne dla rodziców i dzieci** - jasne, wesołe komunikaty
- ✅ **Bez śledzenia** - żadnych cookies ani analityki

## 📁 Struktura projektu

```
.
├── index.html                # Struktura HTML
├── app.js                    # Logika aplikacji
├── styles.css                # Styling (motyw kaczuszek)
├── data/
│   ├── collections.json      # Listę zbiórek
│   ├── incomes.json          # Inne wpływy
│   ├── expenses.json         # Wydatki
│   ├── events.json           # Wydarzenia
│   └── banking.json          # Dane bankowe
└── receipts/                 # Paragony (pliki PDF/JPG)
```

## 📊 Format danych

### collections.json
```json
{
  "collections": [
    {
      "name": "Kino w przedszkolu",
      "status": "open",
      "amountPerChild": 50,
      "paid": [1, 2, 3, 5]
    }
  ]
}
```

### events.json
```json
{
  "events": [
    {
      "date": "2026-04-17",
      "title": "Zajęcia plastyczne",
      "description": "Malowanie jajek"
    }
  ]
}
```

### banking.json
```json
{
  "account_number": "PL12345678901234567890123456",
  "blik": "123456789",
  "revolut": "https://..."
}
```

## 🚀 Uruchomienie lokalnie

```bash
git clone https://github.com/nowakjakub/kaczuszki-skarbiec.git
cd kaczuszki-skarbiec
python3 -m http.server 8000
```

Otwórz: http://localhost:8000

## 🔧 Konfiguracja

- **Liczba dzieci w grupie**: zmień w `app.js` (`const totalChildren = 25`)
- **Dane bankowe**: edytuj `data/banking.json`
- **Zbiórki**: edytuj `data/collections.json`
- **wydarzenia**: edytuj `data/events.json`

## 🚢 Wdrażanie na GitHub Pages

1. Forkuj lub sklonuj repozytorium
2. Zaktualizuj dane w folderze `data/`
3. Push do `main` branch
4. Włącz GitHub Pages w ustawieniach repozytorium
5. Strona będzie dostępna na: `https://{twoja-nazwa}.github.io/{nazwa-repo}/`

## 📱 Responsywność

- **Desktop** (>900px): Grid 2 kolumny
- **Tablet/Mobile** (<900px): 1 kolumna

## 🎯 Specjalne cechy

- **Banner wydarzeń** - wyświetla się dla zdarzeń w ciągu 5 dni
- **Countdown** - czerwony tekst dla bliskich wydarzeń
- **Status płatności** - emojis i komunikaty zachęcające
- **Kopiowanie do schowka** - klik na dane bankowe = skopiuj
- **Lokalny przechowywanie** - preferowanie motywu w `localStorage`

## 📝 Notatka

Strona była opracowywana z myślą o transparentności i łatwości użytkowania dla rodziców. Wolny od zbędnej biurokracji, przyjazny dla detali.

---

*Grupa Kaczuszki — transparentne zarządzanie składkami, wydatkami i wydarzeniami* 🦆
