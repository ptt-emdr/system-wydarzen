import { createElement } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { KartaPdf, type DaneKarty } from "./dokument";

export const dynamic = "force-dynamic";

/**
 * Pobieranie karty zgłoszenia jako pliku PDF (bez okna drukowania).
 * Te same reguły dostępu co strona karty: wymagane zalogowanie do
 * panelu; administrator jednego wydarzenia pobierze wyłącznie karty
 * zgłoszeń swojego wydarzenia.
 */

const STATUSY: Record<string, string> = {
  doAkceptacji: "Do akceptacji (weryfikacja)",
  oczekuje: "Oczekuje na wpłatę",
  potwierdzone: "Potwierdzone (opłacone)",
  rezerwowa: "Lista rezerwowa",
  obecny: "Obecny (po wydarzeniu)",
  nieobecny: "Nieobecny (po wydarzeniu)",
  odrzucone: "Odrzucone (weryfikacja)",
  anulowane: "Anulowane",
};

function dataPL(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function zl(kwota?: number | null): string {
  return `${(kwota || 0).toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return new Response("Wymagane zalogowanie do panelu.", { status: 403 });
  }

  let z: {
    imie?: string; nazwisko?: string; email?: string; telefon?: string;
    status?: string; kwotaNalezna?: number; wplacono?: number;
    terminPlatnosci?: string; kodPlatnosci?: string; createdAt?: string;
    powodOdrzucenia?: string; zgodaRodo?: boolean; chceFakture?: boolean;
    faktura?: { nazwa?: string; nip?: string; adres?: string } | null;
    wydarzenie?: { tytul?: string; dataOd?: string; dataDo?: string; miejsce?: string } | number;
    wybraneTerminy?: { nazwa?: string }[] | null;
    wplaty?: { dzien?: string; kwota?: number; uwagi?: string }[] | null;
    odpowiedzi?: { pytanie?: string; odpowiedz?: string }[] | null;
    zalaczniki?: ({ filename?: string } | number)[] | null;
  };
  try {
    z = (await payload.findByID({
      collection: "zgloszenia",
      id,
      depth: 1,
      overrideAccess: false,
      user,
    })) as unknown as typeof z;
  } catch {
    return new Response("Nie znaleziono zgłoszenia.", { status: 404 });
  }

  const w = typeof z.wydarzenie === "object" && z.wydarzenie !== null ? z.wydarzenie : null;
  const terminWydarzenia = [dataPL(w?.dataOd), w?.dataDo ? dataPL(w.dataDo) : null]
    .filter((t) => t && t !== "—")
    .join(" – ");
  const terminy = (z.wybraneTerminy || []).map((t) => t.nazwa).filter(Boolean) as string[];
  const wplaty = (z.wplaty || []).filter((wp) => wp.kwota != null);
  const zalaczniki = (Array.isArray(z.zalaczniki) ? z.zalaczniki : [])
    .map((p) => (typeof p === "object" && p !== null ? (p as { filename?: string }).filename : null))
    .filter(Boolean) as string[];

  /* logo z głównej strony (ta aplikacja nie ma public/) — bez logo
     dokument i tak się generuje */
  let logo: Buffer | null = null;
  try {
    const odp = await fetch("https://emdr.org.pl/logo-pttemdr.png");
    if (odp.ok) logo = Buffer.from(await odp.arrayBuffer());
  } catch {}

  const dane: DaneKarty = {
    idZgloszenia: String(id),
    dataZgloszenia: dataPL(z.createdAt),
    wygenerowano: dataPL(new Date().toISOString()),
    logo,
    wydarzenie: [
      { l: "Nazwa wydarzenia", w: w?.tytul || "—" },
      { l: "Termin", w: terminWydarzenia || "—" },
      { l: "Miejsce", w: w?.miejsce || "—" },
      ...(terminy.length ? [{ l: "Wybrane terminy (cykl)", w: terminy.join("; ") }] : []),
    ],
    uczestnik: [
      { l: "Imię i nazwisko", w: `${z.imie || ""} ${z.nazwisko || ""}`.trim() },
      { l: "Adres e-mail", w: z.email || "—" },
      { l: "Telefon", w: z.telefon || "—" },
      { l: "Zgoda RODO", w: z.zgodaRodo ? "TAK" : "nie" },
    ],
    platnosci: [
      { l: "Status zgłoszenia", w: STATUSY[z.status || ""] || z.status || "—" },
      ...(z.powodOdrzucenia ? [{ l: "Powód odrzucenia", w: z.powodOdrzucenia }] : []),
      { l: "Do zapłaty", w: zl(z.kwotaNalezna) },
      { l: "Wpłacono", w: zl(z.wplacono) },
      ...(z.terminPlatnosci ? [{ l: "Termin płatności", w: dataPL(z.terminPlatnosci) }] : []),
      ...(z.kodPlatnosci ? [{ l: "Kod do tytułu przelewu", w: z.kodPlatnosci }] : []),
      ...(wplaty.length
        ? [{
            l: "Wpłaty i zwroty",
            w: wplaty
              .map((wp) => `${dataPL(wp.dzien)}: ${zl(wp.kwota)}${wp.uwagi ? ` (${wp.uwagi})` : ""}`)
              .join("; "),
          }]
        : []),
    ],
    faktura: z.chceFakture
      ? [
          { l: "Nazwa firmy / imię i nazwisko", w: z.faktura?.nazwa || "—" },
          { l: "NIP", w: z.faktura?.nip || "—" },
          { l: "Adres", w: z.faktura?.adres || "—" },
        ]
      : null,
    odpowiedzi: (z.odpowiedzi || [])
      .filter((o) => o.pytanie)
      .map((o) => ({ pytanie: o.pytanie || "", odpowiedz: o.odpowiedz || "" })),
    zalaczniki: zalaczniki.length ? zalaczniki.join("; ") : "brak",
  };

  const element = createElement(KartaPdf, { dane }) as React.ReactElement<DocumentProps>;
  const pdf = await renderToBuffer(element);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="karta-zgloszenia-${id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
