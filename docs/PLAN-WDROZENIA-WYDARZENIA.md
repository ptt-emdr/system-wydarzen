# Plan wdrożenia wydarzenia.emdr.org.pl i współpracy ze stroną główną

Wersja 1.0 · 18.08.2026 · role: **[Ty]** — Krzysztof (panele, DNS,
decyzje) · **[K]** — blok techniczny Claude · **[Zarząd]** — decyzje.

Kontekst: cykl DiM ma być ogłoszony **na początku września** — plan jest
ułożony tak, żeby zdążyć z zapasem. Druga aplikacja Node na koncie
cyber_Folks mieści się w limitach wątków (nasza konfiguracja: ~13 wątków
na proces; konto po sprzątnięciu ma duży zapas do ~100).

## ETAP 0 — przygotowania (od zaraz, bez ryzyka)

1. **[Ty]** GitHub: utwórz puste repozytorium `system-wydarzen`
   w organizacji `ptt-emdr` — **[K]** wypchnie istniejące commity.
2. **[K]** Higiena przedprodukcyjna aplikacji: czyszczący seed
   produkcyjny (bez danych testowych), usunięcie konta
   test@wydarzenia.local, zmienna PUBLIC_URL w e-mailach, weryfikacja
   builda standalone (lokalnie, jak dla strony głównej).
3. **[Ty]** Decyzja: kto z obsługi dostaje konta (imienne) do panelu
   wydarzeń.

## ETAP 1 — subdomena i serwer (jak przy czasopiśmie; ~1 dzień z DNS)

1. **[Ty]** DNS w panelu kei: rekord **A `wydarzenia` → 185.208.164.72**
   (TTL 300).
2. **[Ty]** DirectAdmin (konto utfpuzbqpi): Domain Setup → dodaj
   `wydarzenia.emdr.org.pl` (precedens: nowa, czasopismo — w razie
   blokady jedno zgłoszenie do pomocy cyber_Folks).
3. **[Ty]** Po propagacji: certyfikat **Let's Encrypt** w DirectAdmin.
4. **[K]** Struktura na serwerze (odrębna od strony głównej):
   - `~/apps/wydarzenia/` — runtime (standalone; nadpisywany deployem),
   - `~/src/wydarzenia/` — źródła + node_modules do komend CLI,
   - `~/data/wydarzenia/` — **wydarzenia.db + uploads/** (trwałe),
   - `.htaccess` z blokiem Passenger + env w public_html subdomeny.
5. **[K]** Zmienne środowiskowe produkcyjne (komplet, jak strona główna):
   `NODE_ENV=production`, `PAYLOAD_SECRET` (nowy!), `DATABASE_URI`,
   `UPLOADS_DIR`, `SMTP_*` (powiadomienia@emdr.org.pl),
   `PUBLIC_URL=https://wydarzenia.emdr.org.pl` + **limity wątków**
   (UV_THREADPOOL_SIZE=4, VIPS_CONCURRENCY=1, TOKIO_WORKER_THREADS=4,
   NODE_OPTIONS z limit-cpu.cjs) — wg „INSTRUKCJI limity wątków".
   Uwaga: cloudlinux-selector nadpisuje cały zestaw env — podawać komplet.

## ETAP 2 — pierwsze wdrożenie i testy (1 blok)

1. **[K]** Deploy procedurą strony głównej: build lokalny → rsync
   standalone → podmiana natywek linux → restart → **kontrola liczby
   procesów i wątków całego konta** (`ps -o nlwp`) — dwie aplikacje
   muszą zostawić zapas.
2. **[K]** Migracja schematu na czystej bazie (`NODE_ENV=production
   npx payload migrate`), Ustawienia (rachunek! — **[Ty]** podajesz
   właściwy numer konta do wpłat za wydarzenia), noindex zostaje.
3. **[Ty]** Zakładasz konto administratora na
   wydarzenia.emdr.org.pl/admin (+ konta obsługi).
   Ustalona lista kont (18.08.2026):
   - Krzysztof Beyger — krzysztof.beyger@gmail.com,
   - Komisja Promocji — promocja@emdr.org.pl.
4. **[obaj]** Test end-to-end NA PRODUKCJI: testowe wydarzenie
   (nieopublikowane → opublikowane), zapis z załącznikiem, e-maile
   przychodzą z powiadomienia@ (prawdziwy SMTP!), wpłata → status,
   akceptacja/odrzucenie, przypomnienie, PDF karty, eksporty; telefon
   (formularz mobilnie). Po testach: anulowanie/usunięcie testowych.
5. **[K]** Dołączenie `~/data/wydarzenia/` do praktyki backupowej
   (razem z W1 strony głównej) + monitoring (UptimeRobot) dla subdomeny.

## ETAP 3 — współpraca ze stroną główną PTT

Zasada: **integracja przez linki** — żadnego łączenia baz ani API
(systemy pozostają niezależne, jak czasopismo).

1. **[K]** W CMS strony głównej, w kolekcji **Szkolenia**, pole
   **„Link do zapisów"** (URL). Gdy wypełnione — na kaflu szkolenia
   pojawia się przycisk **„Zapisz się"** prowadzący do
   wydarzenia.emdr.org.pl/wydarzenie/…; gdy puste — wszystko wygląda
   jak dotychczas. Analogicznie przycisk w treści aktualności
   (zwykły link — działa od razu, bez zmian w kodzie).
2. **[K]** Podstrona „Dla terapeuty" / sekcja superwizji: stały przycisk
   „Wydarzenia i zapisy" → lista na wydarzenia.emdr.org.pl (do decyzji
   [Zarząd], czy w menu głównym).
3. **[K]** Na stronie zapisów: nagłówek linkuje do emdr.org.pl (już
   jest); po przełączeniu domeny głównej — aktualizacja linków
   nowa.→emdr (jedno miejsce w layoutach).
4. **[Ty]** Ogłoszenie cyklu wrześniowego: aktualność na stronie głównej
   + link do wydarzenia; zdjęcie **noindex** ze strony zapisów w dniu
   ogłoszenia [K].

## ETAP 4 — po starcie zapisów (wrzesień)

1. **[K]** F2 wg priorytetów: import wyciągu ING (trzy sekcje:
   przypisane / do weryfikacji / nieprzypisane), integracja
   z Fakturownią (faktury+KSeF), kody rabatowe, auto-anulowanie po
   terminie płatności z przypomnieniem.
2. **[K]** Moduł raportów ciąg dalszy (statusy, finansowy, faktur;
   raporty 8–9 dla Zarządu na koniec roku).
3. **[K]** F3 przed pierwszym wydarzeniem z certyfikatami: szablony PDF
   (certyfikat, identyfikator — **[Ty]** dostarcza wzory), wysyłka dla
   „Obecnych", recepcja/lista obecności.
4. Aktualizacja dokumentacji technicznej strony głównej (rozdz. o
   subdomenach) i HANDOFF.

## Plan awaryjny

Aplikacje są niezależne: awaria wydarzeń nie dotyka strony głównej.
Rollback wdrożenia = przywrócenie poprzedniego builda (rsync z kopii)
albo wyłączenie subdomeny w DirectAdmin; baza i pliki żyją w
`~/data/wydarzenia` i przetrwają każdy deploy. Przy problemach
z limitami wątków: ubić stare instancje next-server (procedura znana),
w ostateczności plan B — mały VPS wyłącznie dla wydarzeń.
