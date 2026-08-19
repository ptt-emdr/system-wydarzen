import type { Payload } from "payload";

/* Pomocnicze funkcje wspólne dla stron i endpointu zapisów. */

type Prog = { nazwa: string; cenaProgu: number; doKiedy: string };
type Termin = {
  nazwa: string;
  data: string;
  limit?: number | null;
  cenaTerminu?: number | null;
  zapisyDo?: string | null;
};

export type WydarzenieDoc = {
  id: number | string;
  tytul: string;
  slug: string;
  opublikowane?: boolean;
  dataOd: string;
  dataDo?: string | null;
  miejsce?: string | null;
  opis: string;
  cena: number;
  dniNaPlatnosc: number;
  limitMiejsc?: number | null;
  progiCenowe?: Prog[] | null;
  trybZapisu: "wydarzenie" | "terminy";
  terminy?: Termin[] | null;
  pola?:
    | {
        etykieta: string;
        typ: string;
        wymagane?: boolean;
        opcje?: string | null;
      }[]
    | null;
  zbierajDaneFaktury?: boolean;
  instrukcjaPlatnosci?: string | null;
};

/** Cena obowiązująca w tej chwili: najwcześniejszy nieprzeterminowany próg albo cena bazowa. */
export function aktualnaCena(w: WydarzenieDoc, teraz = new Date()): {
  cena: number;
  prog?: string;
} {
  const progi = [...(w.progiCenowe || [])].sort(
    (a, b) => +new Date(a.doKiedy) - +new Date(b.doKiedy),
  );
  for (const p of progi) {
    if (teraz <= new Date(p.doKiedy)) return { cena: p.cenaProgu, prog: p.nazwa };
  }
  return { cena: w.cena };
}

/** Zajęte miejsca (łącznie i per termin) — bez anulowanych i bez listy
 *  rezerwowej (rezerwowi nie zajmują miejsc). */
export async function zajetosc(
  payload: Payload,
  wydarzenieId: number | string,
): Promise<{ lacznie: number; naTermin: Record<string, number> }> {
  const strona = await payload.find({
    collection: "zgloszenia",
    where: {
      and: [
        { wydarzenie: { equals: wydarzenieId } },
        { status: { not_in: ["anulowane", "rezerwowa", "odrzucone"] } },
      ],
    },
    limit: 2000,
    depth: 0,
    overrideAccess: true,
  });
  const naTermin: Record<string, number> = {};
  for (const z of strona.docs as { wybraneTerminy?: { nazwa: string }[] }[]) {
    for (const t of z.wybraneTerminy || []) {
      naTermin[t.nazwa] = (naTermin[t.nazwa] || 0) + 1;
    }
  }
  return { lacznie: strona.totalDocs, naTermin };
}

/** Kwota za wybrane terminy cyklu (cena terminu albo aktualna cena wydarzenia za każdy). */
export function kwotaZaTerminy(
  w: WydarzenieDoc,
  wybrane: string[],
  teraz = new Date(),
): number {
  const bazowa = aktualnaCena(w, teraz).cena;
  let suma = 0;
  for (const nazwa of wybrane) {
    const t = (w.terminy || []).find((x) => x.nazwa === nazwa);
    suma += t?.cenaTerminu ?? bazowa;
  }
  return suma;
}

export function formatujDate(d: string | Date, zGodzina = true): string {
  const data = new Date(d);
  const dd = data.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (!zGodzina) return dd;
  const hh = data.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  return `${dd}, godz. ${hh}`;
}

export function formatujKwote(zl: number): string {
  return zl.toLocaleString("pl-PL", { minimumFractionDigits: 2 }) + " zł";
}

/** Zwykły tekst bez znaczników pogrubienia (do zajawek na kaflach). */
export function bezPogrubien(tekst: string): string {
  return tekst.replace(/\*\*/g, "");
}
