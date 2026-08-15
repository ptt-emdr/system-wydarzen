import { getPayload } from "payload";
import config from "../payload.config";

/**
 * Dane przykładowe do pracy lokalnej i makiety: wrześniowy cykl
 * superwizji Dzieci i Młodzieży (wymagany załącznik certyfikatu)
 * + proste bezpłatne spotkanie. Idempotentny (po slugu).
 */
async function seed() {
  const payload = await getPayload({ config });

  const cykl = {
    tytul: "Cykl superwizji EMDR Dzieci i Młodzieży — jesień 2026",
    slug: "cykl-superwizji-dim-jesien-2026",
    typ: "cykl" as const,
    opublikowane: true,
    dataOd: "2026-10-10T16:00:00.000Z",
    dataDo: "2026-12-12T18:00:00.000Z",
    miejsce: "online (Zoom)",
    opis:
      "Cykl superwizji grupowych dla terapeutów EMDR pracujących z dziećmi i młodzieżą, wspierający w spełnieniu wymagań do certyfikatu Practitionera EMDR Dzieci i Młodzieży.\n\nSuperwizje prowadzą certyfikowani konsultanci–superwizorzy PTT EMDR. Każde spotkanie trwa 2 godziny i obejmuje omówienie przypadków uczestników. Można zapisać się na wybrane terminy lub na cały cykl.\n\nWarunkiem udziału jest ukończone szkolenie EMDR Dzieci i Młodzieży — przy zapisie prosimy o załączenie certyfikatu.",
    cena: 250,
    dniNaPlatnosc: 3,
    trybZapisu: "terminy" as const,
    terminy: [
      { nazwa: "Superwizja I — 10 października, godz. 18.00", data: "2026-10-10T16:00:00.000Z", limit: 12, zapisyDo: "2026-10-08T23:59:00.000Z" },
      { nazwa: "Superwizja II — 14 listopada, godz. 18.00", data: "2026-11-14T16:00:00.000Z", limit: 12, zapisyDo: "2026-11-12T23:59:00.000Z" },
      { nazwa: "Superwizja III — 12 grudnia, godz. 18.00", data: "2026-12-12T16:00:00.000Z", limit: 12, zapisyDo: "2026-12-10T23:59:00.000Z" },
    ],
    pola: [
      {
        etykieta: "Certyfikat ukończenia szkolenia EMDR Dzieci i Młodzieży",
        typ: "zalacznik" as const,
        wymagane: true,
      },
      {
        etykieta: "Miejsce pracy (placówka/praktyka)",
        typ: "tekst" as const,
        wymagane: false,
      },
      {
        etykieta: "Czy uczestniczysz w programie certyfikacyjnym Practitionera DiM?",
        typ: "opcje" as const,
        wymagane: true,
        opcje: "Tak\nJeszcze nie — planuję\nNie",
      },
    ],
    zbierajDaneFaktury: true,
    instrukcjaPlatnosci:
      "Przy zapisie na kilka terminów można opłacić całość jednym przelewem.",
  };

  const spotkanie = {
    tytul: "Spotkanie informacyjne o ścieżce certyfikacyjnej PTT EMDR",
    slug: "spotkanie-informacyjne-certyfikacja",
    typ: "spotkanie" as const,
    opublikowane: true,
    listaRezerwowa: true,
    dataOd: "2026-09-24T17:00:00.000Z",
    miejsce: "online",
    opis:
      "Bezpłatne spotkanie online dla terapeutów zainteresowanych ścieżką certyfikacyjną PTT EMDR: wymagania, przebieg, odpowiedzi na pytania.",
    cena: 0,
    dniNaPlatnosc: 3,
    trybZapisu: "wydarzenie" as const,
    limitMiejsc: 100,
    pola: [],
    zbierajDaneFaktury: false,
  };

  for (const dane of [cykl, spotkanie]) {
    const jest = await payload.find({
      collection: "wydarzenia",
      where: { slug: { equals: dane.slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (jest.totalDocs > 0) {
      await payload.update({
        collection: "wydarzenia",
        id: jest.docs[0].id,
        data: dane,
        overrideAccess: true,
      });
      console.log("Zaktualizowano:", dane.tytul);
    } else {
      await payload.create({ collection: "wydarzenia", data: dane, overrideAccess: true });
      console.log("Utworzono:", dane.tytul);
    }
  }
  console.log("Seed zakończony.");
  process.exit(0);
}

try {
  await seed();
} catch (e) {
  console.error(e);
  process.exit(1);
}
