# Dokumentacja techniczna — System zapisów na wydarzenia PTT EMDR

Wersja 1.1 · 20.08.2026 · dotyczy aplikacji `wydarzenia-app`
(zmiany od 1.0: system NA PRODUKCJI — aneks w rozdz. 15)
(docelowo **https://wydarzenia.emdr.org.pl**).
Autor wdrożenia: Claude (Anthropic) we współpracy z Krzysztofem Beygerem.
Dokument uzupełnia „Dokumentację techniczną strony PTT EMDR" — wspólne
elementy infrastruktury (serwer, poczta, DNS) są opisane tam.

## 1. Czym jest system

Mały system Event Management dla PTT EMDR: **publiczna strona zapisów**
(lista wydarzeń, strona wydarzenia z formularzem, profil uczestnika)
oraz **panel obsługi** (dane + Karty wydarzeń z raportami). Obsługuje
szkolenia, superwizje, cykle, konferencje, webinary i spotkania jako
różne konfiguracje jednego obiektu „Wydarzenie".

**Aplikacja jest CAŁKOWICIE ODRĘBNA od strony Towarzystwa** (decyzja
15.08.2026): osobne repozytorium, osobna baza, osobny panel z własnymi
kontami. Powiązanie ze stroną główną to wyłącznie linki.

## 2. Stos technologiczny

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| CMS / backend | Payload CMS 3 (Local API + REST), panel PL |
| Baza danych | SQLite (@payloadcms/db-sqlite); plik przez `DATABASE_URI` |
| Style | Tailwind CSS 4; paleta identyczna ze stroną PTT (turkus/granat/żółć/krem) |
| E-mail | @payloadcms/email-nodemailer → SMTP kei (powiadomienia@emdr.org.pl); bez zmiennych SMTP_* e-maile trafiają do konsoli |
| Eksporty | exceljs (XLSX), własny CSV (BOM + średniki pod polski Excel) |
| Czcionki | Figtree + Fraunces (next/font, Google) |

## 3. Struktura projektu

```
wydarzenia-app/
├── app/
│   ├── (publiczna)/            # strona zapisów (jasna, paleta PTT)
│   │   ├── page.tsx            # lista opublikowanych wydarzeń
│   │   ├── wydarzenie/[slug]/  # strona wydarzenia + FormularzZapisu (client)
│   │   └── profil/[id]/[token] # profil uczestnika (link tokenowy, bez konta)
│   ├── (payload)/              # panel /admin (boilerplate Payload)
│   ├── panel/                  # KARTY WYDARZEŃ (dashboard + raporty)
│   │   └── wydarzenie/[id]/    # Karta: statystyki, należności, PDF, eksporty
│   └── api/
│       ├── zapisy/             # POST: przyjęcie zgłoszenia (multipart)
│       ├── akceptacja/         # POST: decyzja Akceptuj/Odrzuć (auth)
│       ├── przypomnienia/      # POST: masowe przypomnienia o płatności (auth)
│       └── eksport/            # GET: CSV/XLSX uczestników (auth)
├── collections/                # Wydarzenia, Zgloszenia, ZalacznikiZgloszen, Users
├── globals/Ustawienia.ts       # organizator, rachunek, klauzula RODO
├── components/admin/           # FiltrZgloszen, LinkPanelu, AkceptacjaPrzyciski, DomyslnyMotyw
├── lib/                        # wydarzenia.ts (ceny/zajętość), raporty.ts (statystyki)
└── scripts/seed-demo.ts        # dane przykładowe (idempotentny)
```

## 4. Model danych

### Wydarzenia (`wydarzenia`)
- tytul, **slug** (adres, auto ze slugify), **typ** (konferencja/szkolenie/
  superwizja/cykl/webinar/spotkanie/inne — do raportów), **opublikowane**
  (publicznie widoczne tylko opublikowane), dataOd/dataDo, miejsce, opis.
- **Pieniądze:** cena (0 = bezpłatne), dniNaPlatnosc (termin przelewu),
  limitMiejsc (puste = bez limitu), **progiCenowe[]** (opcjonalne okresy
  wczesna/późna rejestracja: nazwa, cena, doKiedy — obowiązuje pierwszy
  nieprzeterminowany próg, potem cena bazowa).
- **Tryb zapisu:** `wydarzenie` (jeden zapis) albo `terminy` (cykl —
  uczestnik zaznacza terminy; każdy termin: nazwa, data, limit, opcjonalna
  własna cena i data zamknięcia zapisów).
- **pola[]** — kreator formularza: etykieta, typ (tekst / tekstDlugi /
  lista / opcje / checkbox / **zalacznik** / info), wymagane, opcje.
- **Opcje procesu:** `akceptacjaUczestnikow` (weryfikacja dokumentów —
  rozdz. 6.3), `listaRezerwowa` (rozdz. 6.2), zbierajDaneFaktury,
  instrukcjaPlatnosci (dopisek do e-maila).
- Pole wirtualne `liczbaZapisanych` („X" lub „X / limit") — liczone przy
  odczycie z nieanulowanych zgłoszeń, kolumna listy w panelu.

### Zgłoszenia (`zgloszenia`)
- Dane: imie, nazwisko, email, telefon; relacja wydarzenie; wybraneTerminy[];
  odpowiedzi[] {pytanie, odpowiedz}; zalaczniki (relacja); chceFakture +
  faktura {nazwa, nip, adres}; notatka; zgodaRodo.
- **Statusy:** `doAkceptacji` → `oczekuje` → `potwierdzone` → `obecny` /
  `nieobecny`; obok: `rezerwowa`, `odrzucone` (+powodOdrzucenia),
  `anulowane` (+powodAnulowania: rezygnacja / brak-platnosci / zwrot / inny).
- **Pieniądze:** kwotaNalezna, wplaty[] {dzien, kwota, uwagi} (zwrot =
  kwota ujemna), wplacono (liczone), terminPlatnosci, kodPlatnosci
  („WYD-<id>" — tytuł przelewu).
- token (hex 32) — dostęp do profilu bez logowania.
- **Automat statusów (hook beforeChange):** suma wpłat ≥ należność →
  `potwierdzone`, w przeciwnym razie `oczekuje`; automat NIE dotyka
  statusów ręcznych (doAkceptacji, rezerwowa, obecny, nieobecny,
  odrzucone, anulowane). Przejście `rezerwowa → oczekuje` nadaje termin
  płatności i wysyła e-mail „Zwolniło się miejsce" (hook afterChange,
  sygnał przez req.context).
- Dostęp: wyłącznie administrator (create tylko przez endpoint /api/zapisy
  z walidacją serwerową).

### Załączniki zgłoszeń (`zalaczniki-zgloszen`)
Upload (PDF/JPEG/PNG, limit 10 MB w endpointcie); katalog przez
`UPLOADS_DIR`; **odczyt wyłącznie po zalogowaniu** (dane osobowe).

### Users + Ustawienia
Konta obsługi (auth, panel). Ustawienia: organizator, e-mail kontaktowy,
telefon, rachunek {numer, odbiorca}, klauzulaRodo (pod formularzem).

## 5. Publiczna strona zapisów

- Lista wydarzeń: kafle z datą, miejscem, ceną („od progu"), opisem.
- Strona wydarzenia (`/wydarzenie/<slug>`, dynamiczna — liczniki na żywo):
  hero z plakietkami (miejsce, cena/próg, wolne miejsca), opis, tabela
  terminów cyklu z cenami i wolnymi miejscami, formularz.
- **Formularz** buduje się z kreatora pól; zawsze zbiera imię, nazwisko,
  e-mail, telefon; moduł „Proszę o wystawienie faktury" (nazwa, NIP,
  adres); checkbox RODO z klauzulą z Ustawień; walidacja klient + serwer.
- **Limit wyczerpany:** bez opcji listy rezerwowej formularz zastępuje
  wyszarzony komunikat „Limit dostępnych miejsc został wyczerpany";
  pełne terminy cyklu są wyszarzone na liście wyboru.
- **Profil uczestnika** (`/profil/<id>/<token>`): status, kwoty, dane
  do przelewu (dla oczekujących), terminy; bez logowania, ochrona tokenem.

## 6. Przepływy procesu

### 6.1 Zapis standardowy
Zapis → serwer waliduje pola/załączniki/limity → wylicza kwotę (terminy ×
cena lub cena z progu) → tworzy zgłoszenie (termin płatności = teraz +
dniNaPlatnosc) → e-mail z kwotą, rachunkiem, kodem WYD-… i terminem →
obsługa dopisuje wpłatę → status sam przechodzi na Potwierdzone.
Kwota 0 zł = potwierdzenie od razu.

### 6.2 Lista rezerwowa (opcja)
Limit pełny + opcja włączona → formularz działa dalej z komunikatem
„Miejsca niedostępne — zapisujesz się na LISTĘ REZERWOWĄ"; zgłoszenie
bez terminu płatności i bez danych przelewu („nie dokonuj wpłaty").
Przesunięcie na listę główną = zmiana statusu na „Oczekuje" → system
nadaje termin i wysyła e-mail „Zwolniło się miejsce" z przelewem.
Rezerwowi nie zajmują miejsc i nie liczą się do zapisanych/przychodu.

### 6.3 Akceptowanie uczestników (opcja; decyzja 16.08)
Weryfikacja to **wewnętrzna kontrola dokumentów — płatność NIE jest
wstrzymywana**: uczestnik od razu dostaje dane do przelewu i termin,
z notą o weryfikacji i **gwarancji zwrotu wpłaconych środków** przy
negatywnym zamknięciu. Na karcie zgłoszenia (status „Do akceptacji")
przyciski: **Akceptuj** (cichy — bez e-maila, status wg wpłat, termin
bez zmian) i **Odrzuć** (wymaga powodu: podpowiedzi lub tekst własny;
e-mail z powodem, adresem do wyjaśnień i informacją o zwrocie — z kwotą
dotychczasowych wpłat). Finansowo „do akceptacji" liczy się jak
oczekiwanie na wpłatę (raporty, przypomnienia).

### 6.4 E-maile systemowe (wszystkie z powiadomienia@emdr.org.pl)
1. Zgłoszenie przyjęte (+dane przelewu / wariant bezpłatny / nota
   weryfikacyjna), 2. Lista rezerwowa, 3. Zwolniło się miejsce,
4. Zgłoszenie odrzucone (powód+zwrot), 5. Przypomnienie o płatności
(masowe, z Karty wydarzenia). Każdy zawiera link do profilu uczestnika.

## 7. Panel obsługi

- `/admin` (Payload, PL): grupa **Wydarzenia** (Wydarzenia, Zgłoszenia,
  Załączniki) + Administracja (konta, Ustawienia). Domyślnie **jasny
  motyw** (provider DomyslnyMotyw ustawia cookie payload-theme przy
  pierwszej wizycie; zmiana: Konto → Wygląd).
- Lista Wydarzeń: granatowy przycisk „＋ Dodaj wydarzenie", link do Kart
  (nowa karta przeglądarki), kolumna „Zapisani" („X / limit").
- Lista Zgłoszeń: pasek z **filtrem wydarzenia** i licznikami (zapisani /
  limit, opłaceni, oczekuje, do akceptacji, rezerwowa).
- Karta zgłoszenia: wpłaty/zwroty (sterują statusem), przyciski
  akceptacji, zmiana statusu, notatka, dane faktury, załączniki
  (podgląd po zalogowaniu).

## 8. Karty wydarzeń (`/panel`) i raporty

Widok poza Payloadem, ten sam login (cookie payload-token, weryfikacja
`payload.auth()`). Karta wydarzenia = Dashboard:
- kafle: limit, zapisani, wolne, rezerwowa, do akceptacji, oczekują,
  opłaceni, anulowani/odrzuceni, obecni/nieobecni;
- finanse wg definicji z rozdz. 9; tabela terminów cyklu (zapisani/limit);
- **raport należności** (kto, ile, termin, po terminie/w terminie) +
  przycisk „Wyślij przypomnienie o płatności" (z potwierdzeniem);
- **„Pobierz PDF karty"** — wydruk do PDF (media print, stan z chwili
  generowania, linia „Raport wygenerowany: data godzina");
- eksporty uczestników **XLSX** i **CSV**.

## 9. Definicje kwot (zaakceptowane 15.08.2026)

- **Zapisani** = aktywne zgłoszenia bez anulowanych, odrzuconych
  i listy rezerwowej. **Wolne** = limit − zapisani.
- **Przychód oczekiwany** = suma należności zapisanych.
- **Wpłaty zaksięgowane** = wszystkie wpłaty, także osób później
  anulowanych. **Zwroty** = suma operacji ujemnych (osobno).
- **Należności / Nadpłaty** = liczone od osoby (nie kompensują się).
- **Wartość rejestracji** = przychód oczekiwany + wartość anulowanych
  i odrzuconych.

## 10. API (wszystkie ścieżki własne, poza REST Payloada)

| Endpoint | Metoda | Dostęp | Opis |
|---|---|---|---|
| /api/zapisy | POST multipart | publiczny | przyjęcie zgłoszenia; pełna walidacja serwerowa, limity, załączniki, e-mail |
| /api/akceptacja | POST json | admin | decyzja Akceptuj/Odrzuć (komentarz) |
| /api/przypomnienia | POST json | admin | przypomnienia do statusów oczekuje+doAkceptacji z saldem > 0 |
| /api/eksport?wydarzenie=ID[&format=xlsx] | GET | admin | uczestnicy CSV/XLSX |

REST Payloada: publicznie czytelne są tylko opublikowane wydarzenia
i Ustawienia; zgłoszenia, załączniki i konta — wyłącznie po zalogowaniu.

## 11. Bezpieczeństwo i RODO

- Dane osobowe zgłoszeń i pliki załączników niedostępne publicznie
  (dostęp panelowy); profil uczestnika chroniony 128-bitowym tokenem.
- Formularz wymaga zgody RODO (klauzula edytowalna w Ustawieniach).
- E-maile nie zawierają haseł; sekrety wyłącznie w env
  (PAYLOAD_SECRET, SMTP_*, DATABASE_URI, UPLOADS_DIR, PUBLIC_URL).
- Publiczna strona ma `noindex` do dnia wdrożenia (metadata.robots).
- Retencja danych po rozliczeniu wydarzenia — decyzja Zarządu (jak W4
  strony głównej).

## 12. Środowiska i uruchomienie

| Środowisko | Uruchomienie | Baza / pliki |
|---|---|---|
| Lokalne | `npm run dev` (port **3100**); pierwszy start tworzy schemat (dev push) | `wydarzenia-dev.db`, `uploads/` w projekcie |
| Produkcja (**działa od 19.08.2026**) | standalone build + Passenger (CloudLinux, druga aplikacja Node na koncie), https://wydarzenia.emdr.org.pl | `~/data/wydarzenia/{wydarzenia.db, uploads/}` — poza katalogiem aplikacji |

Seed danych przykładowych: `npx payload run scripts/seed-demo.ts`
(cykl DiM z akceptacją i wymaganym certyfikatem + bezpłatne spotkanie
z listą rezerwową). Konto administratora: pierwszy formularz na /admin.
Komendy CLI na serwerze — zawsze z `NODE_ENV=production` (jak strona
główna). Po zmianach komponentów panelu: `npx payload generate:importmap`.

## 13. Repozytorium i konwencje

- Git lokalny w `wydarzenia-app/` (docelowo GitHub `ptt-emdr`);
  commit+push po każdym bloku pracy; komunikaty PL.
- Kod i nazwy pól po polsku (spójnie z ptt-emdr-site); komentarze
  opisują reguły procesu, nie mechanikę.
- Wdrożenie produkcyjne: patrz **PLAN-WDROZENIA-WYDARZENIA.md**.

## 14. Znane ograniczenia wersji 1.0 (plan F2/F3/F4)

1. Wpłaty księgowane ręcznie — **import wyciągu ING** z podpowiadaniem
   skojarzeń w F2; auto-anulowanie po terminie płatności w F2 (dziś:
   przypomnienia ręczne przyciskiem + ręczna anulacja).
2. Faktury: zbierane są dane; **integracja z API Fakturowni** (KSeF po
   jej stronie) w F2. Kody rabatowe — F2.
3. **Certyfikaty i identyfikatory** (szablony PDF, wysyłka dla
   „Obecnych") — F3; obecność jako bramka już istnieje w statusach.
4. Referaty i recenzje — F4. Zapisane filtry list — z modułem raportów.
5. PDF Karty przez okno drukowania (nie bezpośredni download);
   licznik rezerwacji miejsca w trakcie wypełniania — do rozważenia.

---

## 15. Aneks produkcyjny (20.08.2026)

### 15.1. Infrastruktura produkcyjna (wdrożona 19.08.2026)

- **Adres:** https://wydarzenia.emdr.org.pl — jawny rekord A w strefie
  kei → 185.208.164.72 (cyber_Folks s72, konto utfpuzbqpi). HTTP→HTTPS
  wymuszone; certyfikat SSL hostingu ważny do 6.03.2027 (auto-instalacja).
- **Druga aplikacja Node** obok strony głównej: utworzona przez
  `cloudlinux-selector create … --app-root apps/wydarzenia
  --startup-file server.js`; zmienne środowiskowe ustawiane KOMPLETEM
  przez `cloudlinux-selector set --env-vars` (**nadpisuje cały
  zestaw!**) — lądują w `.htaccess` jako `SetEnv`. Osobny
  `PAYLOAD_SECRET` (inny niż strona), `PUBLIC_URL`, limity wątków jak
  strona główna.
- **Baza:** zmigrowana klasycznie (`migrations/20260819_100452_init`,
  bez dev-push na produkcji). Dane i uploady w `~/data/wydarzenia/`
  — przeżywają każde wdrożenie (`rsync --delete` nie sięga poza
  katalog aplikacji).
- **Ustawienia produkcyjne (global „Ustawienia” w panelu):** rachunek
  ING 86 1050 1012 1000 0090 8043 4351, odbiorca: Polskie Towarzystwo
  Terapii EMDR, Al. Jana Pawła II 27, 00-867 Warszawa; e-maile przez
  powiadomienia@ (SMTP kei) — test end-to-end z prawdziwym adresem
  potwierdzony 19.08.
- **Procedura wdrożenia i jej pułapki** — wspólna ze stroną główną:
  `DOKUMENTACJA-TECHNICZNA.md` strony, rozdz. 13 + aneks 45.3
  (mkdir tmp, ~40–60 s Passengera, sprzątanie instancji po
  `readlink /proc/PID/cwd`, spawn EAGAIN, migawka ISR).

### 15.2. Hartowanie po audycie bezpieczeństwa (19.08.2026)

Pełny raport: `AUDYT-BEZPIECZENSTWA-2026-08-19.md` (katalog projektu
strony). Wdrożone (commit `b71dd58`):

| Obszar | Wdrożenie |
|---|---|
| Nagłówki HTTP | HSTS (bez `includeSubDomains` — od 20.08), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, `poweredByHeader: false`, CSP Report-Only |
| Sekret | fail-fast: produkcja bez `PAYLOAD_SECRET` odmawia startu |
| Rate-limit zapisów | max 5 zgłoszeń/h z jednego IP na `/api/zapisy` (mapa w pamięci procesu) |
| Anti-bot | pole-pułapka `www` w formularzu (bot je wypełnia → cicha akceptacja bez zapisu); walidacja formatu e-mail |
| E-maile | `eskapujHtml()` na wartościach z formularza wstawianych do HTML wiadomości |
| Eksport CSV | neutralizacja formuł (`= + - @` → apostrof) — ochrona przed CSV injection; XLSX bezpieczny z natury (exceljs zapisuje tekst) |
| Zależności | `undici` 7.29; świadomie odłożone: bump `sharp`/`next` (breaking) |

### 15.3. Zmiany funkcjonalne po 1.0

- **Pogrubienia w opisie wydarzenia** przez `**tekst**` (19.08) —
  render przez elementy React (bez HTML injection); kafle listy
  pokazują zajawkę bez znaczników (`bezPogrubien`).
- Na produkcji stoją dwa wydarzenia „Testowe — …” do prezentacji
  narzędzia (zapisy na nie działają naprawdę) — do usunięcia po
  prezentacji.
- Konta panelu: Krzysztof (założone); promocja@emdr.org.pl — do
  założenia.

### 15.4. Otwarte pozycje audytu

Backup automatyczny z próbnym restore, monitoring uptime, role
kont/MFA, audit-log operacji — wspólne z planem strony głównej
(HANDOFF.md w repo strony).
