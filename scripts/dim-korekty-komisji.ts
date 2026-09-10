import { getPayload } from "payload";
import config from "../payload.config";
import type { Wydarzenia } from "../payload-types";

/** Korekty redakcyjne Komisji DiM z 10.09.2026 (8 zmian; pkt 9 recenzji
 *  celowo bez zmian). Idempotentny. */
const SLUG = "program-superwizyjny-emdr-dim";

const OPIS_ZAMIANY: [string, string][] = [
  // 1. kryterium 25/50 — do spełnienia W TRAKCIE programu
  [
    "• deklarują - co na etapie certyfikacji jest weryfikowane - spełnienie warunku ukończonych minimum 25 procesów psychoterapeutycznych EMDR i 50 sesji EMDR potwierdzonych przez akredytowanego konsultanta/superwizora EMDR C&A, w tym przedstawienie nagrań z sesji z dziećmi poniżej i powyżej 8. roku życia.",
    "• deklarują możliwość zrealizowania w trakcie trwania programu minimum 25 procesów psychoterapeutycznych EMDR i 50 sesji EMDR, potwierdzonych przez akredytowanego konsultanta/superwizora EMDR C&A. Spełnienie tego warunku będzie weryfikowane na etapie certyfikacji. Wymagane będzie również przedstawienie nagrań sesji z dziećmi poniżej i powyżej 8. roku życia.",
  ],
  // 2. ocena merytoryczna w zasadach kwalifikacji
  [
    "O przyjęciu decyduje spełnienie kryteriów formalnych oraz kolejność kompletnych zgłoszeń.",
    "O przyjęciu decyduje spełnienie kryteriów formalnych, ocena merytoryczna zgłoszenia oraz kolejność kompletnych zgłoszeń.",
  ],
  // 3. termin realizacji
  ["Realizacja programu: lata 2027–2029.", "Realizacja programu: lata 2026–2029."],
  // 4a. nazwisko trenerki (zachowując łamania z panelu)
  ["**Susan Darker**", "**Susan Darker-Smith**"],
  // 4b. „Liczba miejsc" w osobnym akapicie
  ["**Magdalena Wójcik**. Liczba miejsc", "**Magdalena Wójcik**.\n\nLiczba miejsc"],
  // 7. koszty w opisie — spójnie z checkboxem
  [
    "Uczestnicy pokrywają koszty superwizji według stawki **250 zł za spotkanie grupowe**, płatnej przed spotkaniem (ostateczna stawka zostanie potwierdzona przed zawarciem umowy).",
    "Uczestnicy pokrywają koszty superwizji grupowej w wysokości **250 zł za spotkanie**, płatne przed każdym spotkaniem.",
  ],
];

const POLA_ZAMIANY: [string, string][] = [
  // 5. deklaracja aktywnego udziału
  [
    "Deklaruję aktywny udział w superwizji, w tym przedstawienie co najmniej jednego przypadku klinicznego, z zachowaniem pełnej anonimowości pacjentów i/lub innych wskazanych przez superwizora wymagań związanych z przystąpieniem do ścieżki Practitionera C&A",
    "Deklaruję aktywny udział w superwizji, w tym przedstawienie wymaganej przez superwizora liczby przypadków klinicznych, z zachowaniem pełnej anonimowości pacjentów oraz spełnienie innych wymagań wskazanych przez superwizora, związanych z realizacją ścieżki Practitioner C&A",
  ],
  // 6. opłata — bez „planowana" i klauzuli o ostatecznej stawce
  [
    "Przyjmuję do wiadomości, że opłata za spotkanie superwizji grupowej jest planowana w wysokości 250 zł, płatna przed spotkaniem, a ostateczna stawka zostanie podana przed zawarciem umowy / przyjęciem regulaminu",
    "Przyjmuję do wiadomości, że opłata za spotkanie superwizji grupowej wynosi 250 zł, płatna przed spotkaniem",
  ],
];

// 8. etykieta kosztów (góra strony)
const ETYKIETA_STARA = "250 zł za spotkanie superwizyjne - płatne w trakcie programu";
const ETYKIETA_NOWA = "250 zł za spotkanie superwizji grupowej - płatne przed każdym spotkaniem";

const payload = await getPayload({ config });
const { docs } = await payload.find({
  collection: "wydarzenia",
  where: { slug: { equals: SLUG } },
  limit: 1,
  overrideAccess: true,
});
if (!docs.length) { console.log("Brak wydarzenia."); process.exit(0); }
const w = docs[0] as Wydarzenia;

let opis = w.opis || "";
let trafienia = 0;
for (const [a, b] of OPIS_ZAMIANY) {
  if (opis.includes(a)) { opis = opis.replace(a, b); trafienia++; }
  else if (!opis.includes(b)) console.log("NIE ZNALEZIONO (opis):", a.slice(0, 60));
}
const pola = (w.pola || []).map((p) => {
  let et = p.etykieta || "";
  for (const [a, b] of POLA_ZAMIANY) {
    if (et.includes(a)) { et = et.replace(a, b); trafienia++; }
  }
  return { ...p, etykieta: et };
});
let etykieta = w.etykietaKosztow || "";
if (etykieta.includes(ETYKIETA_STARA)) { etykieta = ETYKIETA_NOWA; trafienia++; }
else if (etykieta !== ETYKIETA_NOWA) console.log("NIE ZNALEZIONO (etykieta):", etykieta);

await payload.update({
  collection: "wydarzenia",
  id: w.id,
  data: { opis, etykietaKosztow: etykieta, pola: pola as Wydarzenia["pola"] },
  overrideAccess: true,
});
console.log(`Zastosowano ${trafienia}/8 korekt.`);
process.exit(0);
