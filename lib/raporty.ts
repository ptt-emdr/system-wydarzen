import type { Payload } from "payload";

/**
 * Statystyki wydarzenia wg definicji zaakceptowanych 15.08.2026
 * (MODUL-RAPORTOW-KONCEPCJA.md, rozdz. 4):
 * - zapisani = aktywne zgłoszenia bez anulowanych i bez listy rezerwowej,
 * - wpłaty zaksięgowane = wszystkie wpłaty, także osób później anulowanych,
 * - należności/nadpłaty liczone od osoby (nie kompensują się nawzajem).
 */

type Operacja = { dzien?: string; kwota?: number; uwagi?: string };
export type ZgloszenieRaport = {
  id: number | string;
  imie: string;
  nazwisko: string;
  email: string;
  status: string;
  kwotaNalezna?: number;
  wplacono?: number;
  wplaty?: Operacja[];
  terminPlatnosci?: string | null;
  kodPlatnosci?: string | null;
  wybraneTerminy?: { nazwa: string }[];
  powodAnulowania?: string | null;
  chceFakture?: boolean;
};

export type StatystykiWydarzenia = {
  zapisani: number;
  rezerwowa: number;
  anulowani: number;
  oczekuja: number;
  oplaceni: number;
  obecni: number;
  nieobecni: number;
  przychodOczekiwany: number;
  wplatyZaksiegowane: number;
  zwroty: number;
  naleznosci: number;
  nadplaty: number;
  wartoscRejestracji: number;
  fakturNaProsbe: number;
  nieoplaceni: {
    id: number | string;
    kto: string;
    email: string;
    brakuje: number;
    terminPlatnosci: string | null;
    przekroczony: boolean;
  }[];
  poTerminie: number;
  wTerminie: number;
};

export async function statystykiWydarzenia(
  payload: Payload,
  wydarzenieId: number | string,
): Promise<StatystykiWydarzenia> {
  const { docs } = await payload.find({
    collection: "zgloszenia",
    where: { wydarzenie: { equals: wydarzenieId } },
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  });
  const zgloszenia = docs as unknown as ZgloszenieRaport[];
  const teraz = new Date();

  const s: StatystykiWydarzenia = {
    zapisani: 0, rezerwowa: 0, anulowani: 0, oczekuja: 0, oplaceni: 0,
    obecni: 0, nieobecni: 0, przychodOczekiwany: 0, wplatyZaksiegowane: 0,
    zwroty: 0, naleznosci: 0, nadplaty: 0, wartoscRejestracji: 0,
    fakturNaProsbe: 0, nieoplaceni: [], poTerminie: 0, wTerminie: 0,
  };

  for (const z of zgloszenia) {
    const nalezne = z.kwotaNalezna || 0;
    /* wpłaty zaksięgowane i zwroty — od WSZYSTKICH (także anulowanych) */
    for (const o of z.wplaty || []) {
      const k = o.kwota || 0;
      if (k > 0) s.wplatyZaksiegowane += k;
      else s.zwroty += Math.abs(k);
    }
    if (z.chceFakture) s.fakturNaProsbe++;

    if (z.status === "anulowane") {
      s.anulowani++;
      s.wartoscRejestracji += nalezne;
      continue;
    }
    if (z.status === "rezerwowa") {
      s.rezerwowa++;
      continue;
    }
    /* zapisani (oczekuje / potwierdzone / obecny / nieobecny) */
    s.zapisani++;
    s.przychodOczekiwany += nalezne;
    const wplacono = z.wplacono || 0;
    s.naleznosci += Math.max(nalezne - wplacono, 0);
    s.nadplaty += Math.max(wplacono - nalezne, 0);
    if (z.status === "oczekuje") {
      s.oczekuja++;
      const brakuje = Math.max(nalezne - wplacono, 0);
      if (brakuje > 0) {
        const przekroczony = z.terminPlatnosci
          ? teraz > new Date(z.terminPlatnosci)
          : false;
        if (przekroczony) s.poTerminie++;
        else s.wTerminie++;
        s.nieoplaceni.push({
          id: z.id,
          kto: `${z.nazwisko} ${z.imie}`,
          email: z.email,
          brakuje,
          terminPlatnosci: z.terminPlatnosci || null,
          przekroczony,
        });
      }
    } else {
      s.oplaceni++;
      if (z.status === "obecny") s.obecni++;
      if (z.status === "nieobecny") s.nieobecni++;
    }
  }
  s.wartoscRejestracji += s.przychodOczekiwany;
  s.nieoplaceni.sort((a, b) => Number(b.przekroczony) - Number(a.przekroczony));
  return s;
}
