import { getPayload } from "payload";
import config from "../payload.config";

/**
 * Tworzy wydarzenie rekrutacyjne 2-letniego Programu Superwizyjnego EMDR
 * DiM (ścieżka do Practitioner C&A) — wg dokumentów z katalogu
 * „PROGRAM DiM" (06.09.2026). Idempotentny: gdy wydarzenie o tym slugu
 * już istnieje, NIC nie zmienia (żeby nie nadpisać poprawek z panelu).
 * Tworzy jako NIEOPUBLIKOWANE — publikacja po przeglądzie i dodaniu
 * regulaminu (decyzja Krzysztofa).
 */

const SLUG = "program-superwizyjny-emdr-dim";

const OPIS = `Polskie Towarzystwo Terapii EMDR rozpoczyna rekrutację do **dwuletniego Programu Superwizyjnego EMDR Dzieci i Młodzieży (C&A)**, skierowanego do psychologów, psychoterapeutów i psychiatrów pracujących z dziećmi oraz młodzieżą. Program jest **ścieżką do certyfikatu EMDR Europe Practitioner C&A** — z pełnym wsparciem organizacyjnym Towarzystwa.

Osoby zainteresowane udziałem muszą spełniać poniższe warunki:

• są członkami PTT EMDR;
• uczestniczą obecnie w 4-letnim szkoleniu psychoterapeutycznym (ukończyły co najmniej drugi rok), i/lub ukończyły 4-letnie szkolenie psychoterapeutyczne, i/lub posiadają specjalizację z psychoterapii dzieci i młodzieży, i/lub posiadają specjalizację z psychiatrii dzieci i młodzieży (zdany egzamin PES);
• ukończyły pełne podstawowe szkolenie EMDR (obie części) oraz szkolenie EMDR dotyczące pracy z dziećmi i młodzieżą u jednego z akredytowanych trenerów EMDR C&A;
• deklarują udział w dwuletnim cyklu superwizji grupowej programu — 21 h (w tym 15 h superwizji, po których następuje decyzja konsultanta/superwizora o kolejnych 6 h), trwającym maksymalnie 2 lata od dnia rozpoczęcia;
• deklarują — co na etapie certyfikacji jest weryfikowane — spełnienie warunku ukończonych minimum 25 procesów psychoterapeutycznych EMDR i 50 sesji EMDR potwierdzonych przez akredytowanego konsultanta/superwizora EMDR C&A, w tym przedstawienie nagrań z sesji z dziećmi poniżej i powyżej 8. roku życia.

**Grupy superwizyjne** poprowadzą akredytowani trenerzy/konsultanci EMDR C&A: **Susan Darker** (oraz wskazana przez nią konsultantka), **Esther Bar-Sadeh** (oraz wskazana przez nią konsultantka) i **Magdalena Wójcik**. Liczba miejsc jest ograniczona, a wskazanie preferencji nie gwarantuje przydziału do wybranej grupy.

**Wyjątkowość programu:** Towarzystwo pokrywa koszty tłumaczeń (superwizje z zagranicznymi trenerami będą tłumaczone) oraz różnicę pomiędzy wynagrodzeniem międzynarodowych superwizorów a polskimi stawkami. Uczestnicy pokrywają koszty superwizji według stawki **250 zł za spotkanie grupowe**, płatnej przed spotkaniem (ostateczna stawka zostanie potwierdzona przed zawarciem umowy). Wymagana jest obecność na 90% superwizji, z możliwością uzupełnienia brakujących 10% u wybranego trenera/konsultanta EMDR C&A.

**Cele programu:**

• rozwijanie umiejętności pracy z dziećmi i młodzieżą w oparciu o model AIP,
• pogłębianie wiedzy z zakresu psychotraumatologii rozwojowej,
• rozwijanie umiejętności konceptualizacji przypadku,
• przygotowanie do pracy z bardziej złożonymi zjawiskami klinicznymi (np. dysocjacją i traumą relacyjną),
• rozpoczęcie i potencjalne zakończenie ścieżki certyfikatu Practitioner C&A.

**Korzyści z udziału:** dostęp do międzynarodowych superwizorów, wysokiej jakości treści merytoryczne, wsparcie organizacyjne oraz praktyczne i formalnie uznawane przygotowanie do pracy klinicznej z dziećmi i młodzieżą.

**Zgłoszenia przyjmujemy do 30 września 2026 r., godz. 23:59.** Samo przesłanie formularza nie oznacza zakwalifikowania do programu — Komisja Dzieci i Młodzieży PTT EMDR potwierdzi otrzymanie zgłoszenia, a wynik weryfikacji dokumentów przekaże w terminie do 21 dni. O przyjęciu decydują spełnienie kryteriów formalnych oraz kolejność kompletnych zgłoszeń. Realizacja programu: lata 2027–2029.

W razie pytań prosimy o kontakt: dim@emdr.org.pl`;

type Pole = {
  etykieta: string;
  typ: "tekst" | "tekstDlugi" | "lista" | "opcje" | "wybor" | "checkbox" | "zalacznik" | "info";
  wymagane?: boolean;
  opcje?: string;
};

const POLA: Pole[] = [
  { typ: "info", etykieta: "Wstęp", opcje: "Prosimy o wypełnienie pól wymaganych (*) i dołączenie wskazanych dokumentów. Samo przesłanie formularza nie oznacza zakwalifikowania do programu — Komisja DiM potwierdzi otrzymanie zgłoszenia, a wynik weryfikacji dokumentów przekaże w terminie do 21 dni. WAŻNE: w formularzu nie należy podawać danych pacjentów, opisów przypadków umożliwiających identyfikację ani przesyłać nagrań sesji." },

  /* 1. Dane — imię/nazwisko/e-mail/telefon są wbudowane w formularz */
  { typ: "tekst", etykieta: "Miejscowość / województwo", wymagane: true },
  { typ: "opcje", etykieta: "Preferowany kontakt", opcje: "e-mail\ntelefon" },
  { typ: "wybor", etykieta: "Wykształcenie / wykonywany zawód", wymagane: true, opcje: "psycholog\npsychoterapeuta\nlekarz psychiatra\ninny (podaj poniżej)" },
  { typ: "tekst", etykieta: "Jeśli inny zawód — podaj jaki" },
  { typ: "tekst", etykieta: "Aktualne miejsce lub miejsca pracy (opcjonalnie)" },

  /* 2. Kryteria formalne */
  { typ: "info", etykieta: "Kryteria", opcje: "KRYTERIA FORMALNE — zaznacz odpowiedzi i uzupełnij informacje potwierdzające spełnienie warunków udziału. Komisja może zweryfikować członkostwo w PTT EMDR w ewidencji Towarzystwa." },
  { typ: "checkbox", etykieta: "Jestem członkiem/członkinią PTT EMDR (udział w programie wymaga członkostwa)", wymagane: true },
  { typ: "wybor", etykieta: "Który warunek przygotowania psychoterapeutycznego lub specjalizacyjnego spełniasz?", wymagane: true, opcje: "uczestniczę w 4-letnim szkoleniu psychoterapeutycznym i ukończyłem/-am co najmniej 2. rok\nukończyłem/-am 4-letnie szkolenie psychoterapeutyczne\nposiadam specjalizację z psychoterapii dzieci i młodzieży\nposiadam specjalizację z psychiatrii dzieci i młodzieży (zdany PES)" },
  { typ: "tekst", etykieta: "Nazwa szkoły/instytucji oraz szkolenia/specjalizacji", wymagane: true },
  { typ: "tekst", etykieta: "Status i rok / data ukończenia", wymagane: true },
  { typ: "checkbox", etykieta: "Ukończyłem/-am pełne szkolenie podstawowe EMDR (obie części/poziomy)", wymagane: true },
  { typ: "tekst", etykieta: "Szkolenie podstawowe EMDR — trener/trenerzy i daty ukończenia", wymagane: true },
  { typ: "checkbox", etykieta: "Ukończyłem/-am I stopień szkolenia EMDR dzieci i młodzieży (C&A) u akredytowanego trenera", wymagane: true },
  { typ: "tekst", etykieta: "I stopień C&A — nazwa szkolenia, akredytowany trener, data ukończenia", wymagane: true },
  { typ: "checkbox", etykieta: "Ukończyłem/-am II stopień szkolenia EMDR dzieci i młodzieży (C&A) u akredytowanego trenera", wymagane: true },
  { typ: "tekst", etykieta: "II stopień C&A — nazwa szkolenia, akredytowany trener, data ukończenia", wymagane: true },

  /* 3. Doświadczenie kliniczne */
  { typ: "info", etykieta: "Doświadczenie", opcje: "DOŚWIADCZENIE KLINICZNE I GOTOWOŚĆ DO ŚCIEŻKI PRACTITIONER C&A" },
  { typ: "opcje", etykieta: "Czy obecnie pracujesz psychoterapeutycznie z dziećmi i/lub młodzieżą?", wymagane: true, opcje: "tak\nnie" },
  { typ: "wybor", etykieta: "Z jakimi grupami wiekowymi pracujesz?", wymagane: true, opcje: "dzieci poniżej 8 lat\ndzieci 8–12 lat\nmłodzież 13–17 lat\nmłodzi dorośli" },
  { typ: "tekstDlugi", etykieta: "Krótko opisz doświadczenie w pracy EMDR z dziećmi i młodzieżą (nie podawaj danych ani szczegółów umożliwiających identyfikację pacjentów)", wymagane: true },
  { typ: "opcje", etykieta: "Czy w okresie trwania programu przewidujesz możliwość zrealizowania i udokumentowania co najmniej 25 procesów psychoterapeutycznych EMDR oraz 50 sesji EMDR z dziećmi i młodzieżą?", wymagane: true, opcje: "tak\nnie\ntrudno ocenić na tym etapie" },
  { typ: "opcje", etykieta: "Czy przewidujesz możliwość przedstawienia na etapie certyfikacji nagrań sesji z dzieckiem poniżej 8. roku życia oraz z dzieckiem powyżej 8. roku życia (po uzyskaniu wszystkich wymaganych zgód i z zachowaniem zasad poufności)?", wymagane: true, opcje: "tak\nnie\ntrudno ocenić na tym etapie" },
  { typ: "tekstDlugi", etykieta: "Jakie są Twoje najważniejsze cele rozwojowe związane z udziałem w programie?", wymagane: true },
  { typ: "wybor", etykieta: "Jakie zagadnienia kliniczne są dla Ciebie szczególnie ważne?", opcje: "konceptualizacja przypadku w modelu AIP\npsychotraumatologia rozwojowa\ntrauma relacyjna\ndysocjacja\npraca z opiekunami / systemem rodzinnym\ninne (podaj poniżej)" },
  { typ: "tekst", etykieta: "Inne ważne zagadnienia — jakie?" },

  /* 4. Preferencje organizacyjne i językowe */
  { typ: "info", etykieta: "Preferencje", opcje: "PREFERENCJE ORGANIZACYJNE I JĘZYKOWE — przydział do grupy zależy od liczby miejsc, języka pracy, dostępności superwizorów i ostatecznej organizacji programu; wskazanie preferencji nie gwarantuje przydziału." },
  { typ: "wybor", etykieta: "Wskaż preferowaną grupę / osobę prowadzącą (możesz zaznaczyć więcej niż jedną)", wymagane: true, opcje: "Susan Darker i/lub wyznaczona przez nią konsultantka\nEsther Bar-Sadeh i/lub wyznaczona przez nią konsultantka\nMagdalena Wójcik" },
  { typ: "tekst", etykieta: "Kolejność preferencji (1 = najwyższa), jeśli wskazujesz więcej niż jedną grupę" },
  { typ: "lista", etykieta: "Poziom znajomości języka angielskiego w kontekście klinicznym", wymagane: true, opcje: "podstawowy\nśrednio zaawansowany\nzaawansowany\nbiegły" },
  { typ: "opcje", etykieta: "Czy potrzebujesz tłumaczenia podczas superwizji prowadzonej w języku angielskim?", wymagane: true, opcje: "tak\nnie\nzależy od formuły spotkania" },
  { typ: "tekstDlugi", etykieta: "Czy masz potrzeby organizacyjne lub dostępnościowe, które warto uwzględnić? (podaj tylko informacje potrzebne do organizacji udziału)" },

  /* 5. Deklaracje */
  { typ: "info", etykieta: "Deklaracje", opcje: "DEKLARACJE OSOBY ZGŁASZAJĄCEJ SIĘ — każdą deklarację należy zaznaczyć osobno. Szczegółowe zasady udziału, harmonogram, ostateczne koszty i warunki rezygnacji zostaną przedstawione w regulaminie lub umowie przed rozpoczęciem programu." },
  { typ: "checkbox", etykieta: "Potwierdzam, że informacje podane w formularzu są zgodne z prawdą i mogą zostać zweryfikowane na podstawie załączonych dokumentów", wymagane: true },
  { typ: "checkbox", etykieta: "Deklaruję gotowość udziału w programie trwającym maksymalnie 24 miesiące, obejmującym 15 godzin obowiązkowej superwizji grupowej oraz — po pozytywnej decyzji konsultanta/superwizora EMDR C&A — kolejne 6 godzin superwizji", wymagane: true },
  { typ: "checkbox", etykieta: "Deklaruję udział w co najmniej 90% superwizji grupowych oraz gotowość uzupełnienia dopuszczalnej nieobecności na zasadach określonych w regulaminie programu", wymagane: true },
  { typ: "checkbox", etykieta: "Deklaruję aktywny udział w superwizji, w tym przedstawienie co najmniej jednego przypadku klinicznego, z zachowaniem pełnej anonimowości pacjentów i/lub innych wskazanych przez superwizora wymagań związanych z przystąpieniem do ścieżki Practitionera C&A", wymagane: true },
  { typ: "checkbox", etykieta: "Zobowiązuję się do przestrzegania zasad poufności, etyki zawodowej, ochrony danych oraz zasad bezpiecznego prezentowania przypadków i nagrań sesji", wymagane: true },
  { typ: "checkbox", etykieta: "Przyjmuję do wiadomości, że opłata za spotkanie superwizji grupowej jest planowana w wysokości 250 zł, płatna przed spotkaniem, a ostateczna stawka zostanie podana przed zawarciem umowy / przyjęciem regulaminu", wymagane: true },
  { typ: "checkbox", etykieta: "Deklaruję gotowość pokrywania kosztów superwizji grupowej przez cały wymagany cykl. Przyjmuję do wiadomości, że projekt regulaminu przewiduje w razie rezygnacji obowiązek pokrycia kosztów pozostałych obowiązkowych sesji do łącznego wymiaru 15 godzin; warunek ten wymaga przedstawienia i zaakceptowania w finalnym regulaminie lub umowie", wymagane: true },
  { typ: "checkbox", etykieta: "Przyjmuję do wiadomości, że udział w programie nie gwarantuje uzyskania certyfikatu Practitioner EMDR C&A; decyzja o gotowości do dalszego etapu należy do akredytowanego konsultanta/superwizora, a warunki certyfikacji są weryfikowane odrębnie", wymagane: true },
  { typ: "checkbox", etykieta: "Zapoznałem/-am się z regulaminem programu i akceptuję jego warunki (regulamin: wydarzenia.emdr.org.pl/regulamin-dim)", wymagane: true },

  /* 6. Załączniki */
  { typ: "info", etykieta: "Załączniki", opcje: "WYMAGANE ZAŁĄCZNIKI — skany w formacie PDF/JPG/PNG, do 10 MB każdy. Nie dołączaj dokumentacji pacjentów ani nagrań sesji." },
  { typ: "zalacznik", etykieta: "Skan: dokument potwierdzający status szkolenia psychoterapeutycznego lub posiadaną specjalizację", wymagane: true },
  { typ: "zalacznik", etykieta: "Skan: certyfikat(y) ukończenia pełnego szkolenia podstawowego EMDR", wymagane: true },
  { typ: "zalacznik", etykieta: "Skan: certyfikat ukończenia I stopnia szkolenia EMDR dzieci i młodzieży (C&A)", wymagane: true },
  { typ: "zalacznik", etykieta: "Skan: certyfikat ukończenia II stopnia szkolenia EMDR dzieci i młodzieży (C&A)", wymagane: true },
];

const payload = await getPayload({ config });
const jest = await payload.find({
  collection: "wydarzenia",
  where: { slug: { equals: SLUG } },
  limit: 1,
  overrideAccess: true,
});
if (jest.totalDocs > 0) {
  console.log(`Wydarzenie „${SLUG}" już istnieje (id ${jest.docs[0].id}) — bez zmian.`);
  process.exit(0);
}
const w = await payload.create({
  collection: "wydarzenia",
  data: {
    tytul:
      "2-letni Program Superwizyjny EMDR w Terapii Dzieci i Młodzieży — ścieżka do certyfikatu Practitioner C&A",
    slug: SLUG,
    typ: "cykl",
    opublikowane: false,
    dataOd: "2027-01-15T17:00:00.000Z",
    miejsce: "online",
    opis: OPIS,
    cena: 0,
    dniNaPlatnosc: 3,
    limitMiejsc: 10,
    zapisyDo: "2026-09-30T21:59:00.000Z",
    etykietaKosztow: "250 zł za spotkanie superwizyjne — płatne w trakcie programu",
    trybZapisu: "wydarzenie",
    akceptacjaUczestnikow: true,
    listaRezerwowa: true,
    zbierajDaneFaktury: true,
    pola: POLA,
  },
  overrideAccess: true,
});
console.log(`Utworzono wydarzenie id ${w.id} (NIEOPUBLIKOWANE), slug: ${SLUG}, pól formularza: ${POLA.length}`);
process.exit(0);
