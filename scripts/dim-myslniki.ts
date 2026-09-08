import { getPayload } from "payload";
import config from "../payload.config";
import type { Wydarzenia } from "../payload-types";

/** Zamiana długich myślników „—" na zwykłe „-" w całej treści
 *  wydarzenia DiM (decyzja 06.09.2026). Idempotentny. */
const SLUG = "program-superwizyjny-emdr-dim";
const zam = (s: string) => s.replaceAll("—", "-");

const payload = await getPayload({ config });
const { docs } = await payload.find({
  collection: "wydarzenia",
  where: { slug: { equals: SLUG } },
  limit: 1,
  overrideAccess: true,
});
if (!docs.length) { console.log("Brak wydarzenia."); process.exit(0); }
const w = docs[0] as Wydarzenia;

const pola = (w.pola || []).map((p) => ({
  ...p,
  etykieta: p.etykieta ? zam(p.etykieta) : p.etykieta,
  opcje: p.opcje ? zam(p.opcje) : p.opcje,
}));
await payload.update({
  collection: "wydarzenia",
  id: w.id,
  data: {
    opis: zam(w.opis || ""),
    etykietaKosztow: w.etykietaKosztow ? zam(w.etykietaKosztow) : w.etykietaKosztow,
    pola: pola as Wydarzenia["pola"],
  },
  overrideAccess: true,
});
console.log("Myślniki zamienione (opis + etykieta kosztów + pola).");
process.exit(0);
