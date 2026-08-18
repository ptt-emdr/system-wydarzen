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
    doAkceptacji: "do akceptacji",
    oczekuje: "oczekuje na wpłatę",
    potwierdzone: "potwierdzone",
    rezerwowa: "lista rezerwowa",
    obecny: "obecny",
    nieobecny: "nieobecny",
    odrzucone: "odrzucone",
    anulowane: "anulowane",
  };

  const dane = docs.map((z) => {
    const d = z as unknown as Record<string, unknown> & {
      wydarzenie?: { tytul?: string };
      wybraneTerminy?: { nazwa: string }[];
      odpowiedzi?: { pytanie: string; odpowiedz: string }[];
      faktura?: { nazwa?: string; nip?: string };
    };
    return [
      d.nazwisko, d.imie, d.email, d.telefon,
      typeof d.wydarzenie === "object" ? d.wydarzenie?.tytul : d.wydarzenie,
      (d.wybraneTerminy || []).map((t) => t.nazwa).join("; "),
      statusy[String(d.status)] || d.status,
      d.kwotaNalezna, d.wplacono,
      d.terminPlatnosci ? new Date(String(d.terminPlatnosci)).toLocaleDateString("pl-PL") : "",
      d.kodPlatnosci,
      d.chceFakture ? d.faktura?.nazwa || "tak" : "",
      d.faktura?.nip,
      (d.odpowiedzi || []).map((o) => `${o.pytanie}: ${o.odpowiedz}`).join(" | "),
    ];
  });

  /* ---- XLSX (Excel) ---- */
  if (url.searchParams.get("format") === "xlsx") {
    const { default: ExcelJS } = await import("exceljs");
    const zeszyt = new ExcelJS.Workbook();
    const arkusz = zeszyt.addWorksheet("Uczestnicy");
    arkusz.addRow(naglowki);
    arkusz.getRow(1).font = { bold: true };
    for (const w of dane) arkusz.addRow(w);
    arkusz.columns.forEach((k, i) => {
      k.width = Math.min(
        Math.max(naglowki[i].length, ...dane.map((w) => String(w[i] ?? "").length)) + 2,
        50,
      );
    });
    const bufor = await zeszyt.xlsx.writeBuffer();
    return new Response(bufor, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="zgloszenia-${wydarzenieId || "wszystkie"}.xlsx"`,
      },
    });
  }

  /* ---- CSV: BOM + średniki = polski Excel otwiera od dwukliku ---- */
  const csv =
    "﻿" +
    [naglowki.join(";"), ...dane.map((w) => w.map(pole).join(";"))].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zgloszenia-${wydarzenieId || "wszystkie"}.csv"`,
    },
  });
}
