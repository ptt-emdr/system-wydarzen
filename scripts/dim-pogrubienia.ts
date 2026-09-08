import { getPayload } from "payload";
import config from "../payload.config";

/**
 * Pogrubia nagłówki sekcji w blokach informacyjnych istniejącego
 * wydarzenia DiM (decyzja 06.09.2026). Idempotentny — pomija bloki,
 * które już zawierają **.
 */
const SLUG = "program-superwizyjny-emdr-dim";

const ZAMIANY: [string, string][] = [
  [
    "Samo przesłanie formularza nie oznacza zakwalifikowania do programu —",
    "**Samo przesłanie formularza nie oznacza zakwalifikowania do programu** —",
  ],
  ["WAŻNE: w formularzu", "**WAŻNE:** w formularzu"],
  ["KRYTERIA FORMALNE — zaznacz", "**KRYTERIA FORMALNE** — zaznacz"],
  [
    "DOŚWIADCZENIE KLINICZNE I GOTOWOŚĆ DO ŚCIEŻKI PRACTITIONER C&A",
    "**DOŚWIADCZENIE KLINICZNE I GOTOWOŚĆ DO ŚCIEŻKI PRACTITIONER C&A**",
  ],
  ["PREFERENCJE ORGANIZACYJNE I JĘZYKOWE — przydział", "**PREFERENCJE ORGANIZACYJNE I JĘZYKOWE** — przydział"],
  ["DEKLARACJE OSOBY ZGŁASZAJĄCEJ SIĘ — każdą", "**DEKLARACJE OSOBY ZGŁASZAJĄCEJ SIĘ** — każdą"],
  ["WYMAGANE ZAŁĄCZNIKI — skany", "**WYMAGANE ZAŁĄCZNIKI** — skany"],
];

const payload = await getPayload({ config });
const { docs } = await payload.find({
  collection: "wydarzenia",
  where: { slug: { equals: SLUG } },
  limit: 1,
  overrideAccess: true,
});
if (!docs.length) {
  console.log("Brak wydarzenia — nic do zrobienia.");
  process.exit(0);
}
import type { Wydarzenia } from "../payload-types";
const w = docs[0] as Wydarzenia;
let zmian = 0;
const pola = (w.pola || []).map((p) => {
  if (p.typ !== "info" || !p.opcje || p.opcje.includes("**")) return p;
  let nowy = p.opcje;
  for (const [a, b] of ZAMIANY) nowy = nowy.replace(a, b);
  if (nowy !== p.opcje) zmian++;
  return { ...p, opcje: nowy };
});
if (zmian === 0) {
  console.log("Bloki już pogrubione — bez zmian.");
  process.exit(0);
}
await payload.update({
  collection: "wydarzenia",
  id: w.id,
  data: { pola: pola as Wydarzenia["pola"] },
  overrideAccess: true,
});
console.log(`Zaktualizowano ${zmian} bloków informacyjnych.`);
process.exit(0);
