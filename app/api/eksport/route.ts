import { getPayload } from "payload";
import config from "@payload-config";

/**
 * Eksport zgłoszeń do CSV (otwiera się w Excelu): /api/eksport?wydarzenie=ID
 * Wymaga zalogowania do panelu (ten sam plik cookie) — dane osobowe.
 */
export async function GET(req: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return new Response("Wymagane logowanie do panelu.", { status: 403 });
  }

  const url = new URL(req.url);
  const wydarzenieId = url.searchParams.get("wydarzenie");
  const { docs } = await payload.find({
    collection: "zgloszenia",
    where: wydarzenieId ? { wydarzenie: { equals: wydarzenieId } } : {},
    limit: 5000,
    depth: 1,
    sort: "nazwisko",
    overrideAccess: true,
  });

  const naglowki = [
    "Nazwisko", "Imię", "E-mail", "Telefon", "Wydarzenie", "Terminy",
    "Status", "Należność", "Wpłacono", "Termin płatności", "Kod przelewu",
    "Faktura", "NIP", "Odpowiedzi",
  ];
  const pole = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const statusy: Record<string, string> = {
    oczekuje: "oczekuje na wpłatę",
    potwierdzone: "potwierdzone",
    obecny: "obecny",
    anulowane: "anulowane",
  };

  const wiersze = docs.map((z) => {
    const d = z as Record<string, unknown> & {
      wydarzenie?: { tytul?: string };
      wybraneTerminy?: { nazwa: string }[];
      odpowiedzi?: { pytanie: string; odpowiedz: string }[];
      faktura?: { nazwa?: string; nip?: string };
    };
    return [
      pole(d.nazwisko), pole(d.imie), pole(d.email), pole(d.telefon),
      pole(typeof d.wydarzenie === "object" ? d.wydarzenie?.tytul : d.wydarzenie),
      pole((d.wybraneTerminy || []).map((t) => t.nazwa).join("; ")),
      pole(statusy[String(d.status)] || d.status),
      pole(d.kwotaNalezna), pole(d.wplacono),
      pole(d.terminPlatnosci ? new Date(String(d.terminPlatnosci)).toLocaleDateString("pl-PL") : ""),
      pole(d.kodPlatnosci),
      pole(d.chceFakture ? d.faktura?.nazwa || "tak" : ""),
      pole(d.faktura?.nip),
      pole((d.odpowiedzi || []).map((o) => `${o.pytanie}: ${o.odpowiedz}`).join(" | ")),
    ].join(";");
  });

  /* BOM + średniki = polski Excel otwiera poprawnie od dwukliku */
  const csv = "﻿" + [naglowki.join(";"), ...wiersze].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zgloszenia-${wydarzenieId || "wszystkie"}.csv"`,
    },
  });
}
