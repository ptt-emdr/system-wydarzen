# Instrukcja obsługi panelu — System zapisów na wydarzenia PTT EMDR

**Dla osoby obsługującej wydarzenia, bez wiedzy technicznej**
wersja 1.0 · 18.08.2026 · dotyczy wydarzenia.emdr.org.pl
(w czasie testów: http://localhost:3100)

---

## 1. Dwa miejsca pracy — co jest gdzie

| Miejsce | Adres | Do czego służy |
|---|---|---|
| **Panel danych** | wydarzenia.emdr.org.pl/**admin** | dodawanie wydarzeń, przeglądanie zgłoszeń, dopisywanie wpłat, akceptacja uczestników |
| **Karty wydarzeń** | wydarzenia.emdr.org.pl/**panel** | podsumowanie wydarzenia w liczbach, należności, przypomnienia, PDF, eksporty do Excela |

Logujesz się raz — te same konto działa w obu miejscach. Panel otwiera
się w **jasnej wersji**; wolisz ciemną? Prawy górny róg → Konto →
sekcja „Wygląd".

Uczestnicy niczego z tego nie widzą — dla nich istnieje tylko strona
wydarzenia z formularzem.

---

## 2. Jak dodać wydarzenie

1. Panel → **Wydarzenia** → granatowy przycisk **„＋ Dodaj wydarzenie"**.
2. Wypełnij podstawy: nazwa, **typ** (szkolenie/superwizja/cykl/…),
   data rozpoczęcia (i ew. zakończenia), miejsce (lub „online"), opis
   (pusta linia = nowy akapit).
3. **Pieniądze:** Cena (0 = bezpłatne) i **Dni na płatność** (ile dni na
   przelew ma uczestnik — po tym czasie miejsce wraca do puli).
   Opcjonalnie **Limit miejsc** (puste = bez limitu).
4. **Cykl terminów?** Ustaw „Na co zapisuje się uczestnik" na „Wybrane
   terminy z listy" i dodaj terminy — każdy z własną datą, limitem
   i (opcjonalnie) ceną oraz datą zamknięcia zapisów. Uczestnik zaznaczy
   terminy, a system policzy sumę.
5. **Wczesna/późna rejestracja?** (opcja) W „Progi cenowe" dodaj np.
   „Wczesna rejestracja, 450 zł, do 30.09" — po tej dacie obowiązuje
   automatycznie Cena podstawowa.
6. **Dodatkowe pola formularza** — tu decydujesz, o co pytamy przy
   zapisie: pola tekstowe, listy wyboru, pola tak/nie oraz **Załącznik**
   (np. „Certyfikat ukończenia szkolenia DiM" z ptaszkiem „wymagane" —
   bez pliku nie da się wysłać zgłoszenia).
7. **Opcje procesu** (prawa kolumna):
   - **Akceptowanie uczestników** — włącz, gdy obsługa ma sprawdzać
     dokumenty (rozdz. 5). Płatność i tak biegnie od razu.
   - **Lista rezerwowa** — włącz, jeśli po wyczerpaniu limitu zapisy
     mają być przyjmowane na listę rezerwową (rozdz. 6).
8. Kliknij **Zapisz**. Wydarzenie pojawi się publicznie dopiero po
   zaznaczeniu **„Opublikowane"** — do tego czasu możesz dopracowywać.

Adres strony wydarzenia: wydarzenia.emdr.org.pl/wydarzenie/**adres-slug**
(tworzy się sam z nazwy; znajdziesz go w prawej kolumnie). Ten link
wkleja się w ogłoszenia na stronie Towarzystwa.

---

## 3. Zgłoszenia — codzienna praca

Panel → **Zgłoszenia**. Nad listą wybierz **wydarzenie z listy
rozwijanej** — zobaczysz tylko jego uczestników i licznik: *Zapisanych
X / limit · opłaconych · oczekuje · do akceptacji · lista rezerwowa*.

**Statusy zgłoszenia:**

| Status | Znaczenie |
|---|---|
| Do akceptacji | czeka na Twoją weryfikację dokumentów (jeśli opcja włączona) |
| Oczekuje na wpłatę | zapisany, ma termin na przelew |
| Potwierdzone | opłacone — ustawia się SAMO po dopisaniu wpłaty |
| Lista rezerwowa | czeka na zwolnienie miejsca |
| Obecny / Nieobecny | uzupełniasz po wydarzeniu (od tego zależą certyfikaty) |
| Odrzucone / Anulowane | poza wydarzeniem (z powodem) |

### Jak zaksięgować wpłatę (także „ktoś zapłacił za kogoś")
1. Otwórz kartę uczestnika (znajdziesz go filtrem lub wyszukiwarką).
2. Sekcja **„Wpłaty i zwroty"** → Dodaj Operację → data, kwota,
   w Uwagach np. „przelew od partnera, bez kodu".
3. **Zapisz** — status sam przejdzie na „Potwierdzone", gdy suma pokryje
   należność. Zwrot = kwota ujemna. Wpłata częściowa = status zostaje,
   saldo widać na karcie i na profilu uczestnika.

Tytuł przelewu uczestnika to zawsze kod **WYD-numer** — widnieje na
karcie zgłoszenia, w e-mailach i na profilu uczestnika.

---

## 4. Co dostaje uczestnik (automatycznie)

1. **Po zapisie** — e-mail z kwotą, numerem rachunku, kodem do tytułu
   przelewu i terminem płatności (przy wydarzeniu bezpłatnym — od razu
   potwierdzenie). Jeżeli wydarzenie ma weryfikację dokumentów, dochodzi
   informacja o niej i o gwarancji zwrotu środków.
2. **Link do profilu** — uczestnik zawsze widzi swój status i saldo
   (bez zakładania konta).
3. **Po przesunięciu z listy rezerwowej** — e-mail „Zwolniło się miejsce"
   z danymi do przelewu i terminem.
4. **Po odrzuceniu** — e-mail z powodem (rozdz. 5).
5. **Przypomnienie o płatności** — gdy klikniesz przycisk na Karcie
   wydarzenia (rozdz. 7).

---

## 5. Akceptowanie uczestników (weryfikacja dokumentów)

Działa, gdy wydarzenie ma włączoną opcję. Nowe zgłoszenia mają status
**„Do akceptacji"**, a na karcie uczestnika widzisz żółtą ramkę:

- **✓ Akceptuj uczestnika** — jedno kliknięcie; bez e-maila (uczestnik
  ma już wszystko z wiadomości powitalnej), status przejdzie na
  „Oczekuje" albo „Potwierdzone" (jeśli już zapłacił).
- **✕ Odrzuć uczestnika…** — wybierz gotowy powód (np. „Niewłaściwy
  dokument") **albo wpisz własny** i kliknij „Odrzuć i wyślij powód".
  Uczestnik dostanie e-mail z powodem, adresem do wyjaśnień i informacją
  o zwrocie wpłaconych środków. Jeżeli coś wpłacił — pamiętaj zlecić
  zwrot i dopisać go (kwota ujemna) na karcie.

Załączony dokument otworzysz z karty zgłoszenia (sekcja Załączniki) —
pliki są widoczne tylko po zalogowaniu.

**Ważne:** odrzucaj przyciskiem, nie ręczną zmianą statusu — tylko
przycisk wysyła uczestnikowi powód.

---

## 6. Lista rezerwowa

Gdy opcja jest włączona i limit się wyczerpie, formularz sam przechodzi
w tryb „Zapisz się na listę rezerwową" (uczestnik wie, że nie płaci).
Gdy zwolni się miejsce: otwórz zgłoszenie rezerwowe → zmień status na
**„Oczekuje na wpłatę"** → Zapisz. System sam nada termin płatności
i wyśle e-mail z danymi przelewu. Bez tej opcji zapisy po limicie są
zablokowane z komunikatem „Limit dostępnych miejsc został wyczerpany".

---

## 7. Karty wydarzeń — liczby, należności, raporty

Wejście: przycisk **„Otwórz Karty wydarzeń"** nad listą Wydarzeń
(otwiera się w nowej karcie) albo adres /panel. Wybierz wydarzenie.

- **Podsumowanie**: zapisani/limit/wolni, lista rezerwowa, do akceptacji,
  opłaceni, przychód oczekiwany, wpłaty, należności, zwroty; przy cyklu —
  tabela terminów z obłożeniem.
- **Należności**: lista osób z brakującą kwotą i terminem (czerwone =
  po terminie) oraz przycisk **„Wyślij przypomnienie o płatności"** —
  po potwierdzeniu każdy niepłacący dostanie e-mail z kwotą i danymi.
- **„Pobierz PDF karty"** — zapis całego raportu do PDF (przez okno
  wydruku wybierz „Zapisz jako PDF"); na dokumencie jest data i godzina
  wygenerowania.
- **Eksporty**: „Uczestnicy — Excel (XLSX)" i CSV — pełna lista z polami
  formularza, saldami i danymi do faktur.

---

## 8. Po wydarzeniu

1. Na kartach uczestników ustaw **Obecny** / **Nieobecny** (frekwencja).
2. To bramka do certyfikatów (funkcja w przygotowaniu) — wyśle się je
   wyłącznie Obecnym.
3. Pobierz PDF karty i eksport XLSX do dokumentacji wydarzenia.

## 9. Najczęstsze pytania

- **Zgłoszenie testowe?** Otwórz stronę wydarzenia w trybie
  nieopublikowanym się nie da — opublikuj, zapisz się, a testowe
  zgłoszenie potem Anuluj (powód: inny) lub usuń.
- **Zmiana danych uczestnika?** Otwórz kartę, popraw, Zapisz.
- **Uczestnik chce fakturę, a nie zaznaczył?** Zaznacz „Prosi o fakturę"
  na karcie i uzupełnij dane.
- **Coś nie działa?** Napisz do administratora technicznego; awaryjne
  procedury opisuje dokumentacja techniczna.
