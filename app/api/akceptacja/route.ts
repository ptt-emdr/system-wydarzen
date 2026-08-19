import { getPayload } from "payload";
import config from "@payload-config";
import { eskapujHtml, formatujKwote } from "@/lib/wydarzenia";

/**
 * Decyzja o zgłoszeniu w trybie „Akceptowanie uczestników".
 * Weryfikacja to WEWNĘTRZNA kontrola dokumentów — płatność biegnie
 * równolegle od zapisu (decyzja 16.08):
 *  - akceptuj → status „oczekuje"/„potwierdzone" wg wpłat; BEZ e-maila
 *    (uczestnik ma już dane do przelewu z e-maila rejestracyjnego),
 *    termin płatności bez zmian;
 *  - odrzuc → status „odrzucone" + powód; e-mail z powodem, adresem do
 *    wyjaśnień i gwarancją zwrotu wpłaconych środków.
 */
export async function POST(req: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return Response.json({ blad: "Wymagane logowanie." }, { status: 403 });

  const { id, decyzja, komentarz } = (await req.json()) as {
    id?: number | string;
    decyzja?: "akceptuj" | "odrzuc";
    komentarz?: string;
  };
  if (!id || !decyzja) return Response.json({ blad: "Brak danych." }, { status: 400 });
  if (decyzja === "odrzuc" && !komentarz?.trim()) {
    return Response.json({ blad: "Powód odrzucenia jest wymagany." }, { status: 400 });
  }

  const z = (await payload.findByID({
    collection: "zgloszenia",
    id,
    depth: 0,
    overrideAccess: true,
  })) as {
    status: string; imie: string; email: string; kwotaNalezna?: number;
    wplacono?: number; kodPlatnosci?: string; token?: string;
    wydarzenie: number | { id: number };
  };
  if (z.status !== "doAkceptacji") {
    return Response.json({ blad: "To zgłoszenie nie czeka na akceptację." }, { status: 409 });
  }

  const w = (await payload.findByID({
    collection: "wydarzenia",
    id: typeof z.wydarzenie === "object" ? z.wydarzenie.id : z.wydarzenie,
    depth: 0,
    overrideAccess: true,
  })) as { tytul: string; dniNaPlatnosc?: number };
  const u = (await payload.findGlobal({ slug: "ustawienia" })) as {
    rachunek?: { numer?: string; odbiorca?: string };
    emailKontaktowy?: string;
  };
  const bazaUrl = process.env.PUBLIC_URL || "http://localhost:3100";
  const stopka = `<p>Stan zgłoszenia: <a href="${bazaUrl}/profil/${id}/${z.token}">${bazaUrl}/profil/${id}/${z.token}</a></p>
    <p>W razie pytań: ${u.emailKontaktowy || "sekretarz@emdr.org.pl"}</p>`;

  if (decyzja === "odrzuc") {
    await payload.update({
      collection: "zgloszenia",
      id,
      data: { status: "odrzucone", powodOdrzucenia: komentarz!.trim() },
      overrideAccess: true,
    });
    const wplacone = z.wplacono || 0;
    try {
      await payload.sendEmail({
        to: z.email,
        subject: `Zgłoszenie odrzucone: ${w.tytul}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#16303c;line-height:1.5">
          <p>Dzień dobry ${eskapujHtml(z.imie)},</p>
          <p>niestety Twoje zgłoszenie na <b>${w.tytul}</b> zostało odrzucone
          na etapie weryfikacji.</p>
          <p><b>Powód:</b> ${eskapujHtml(komentarz!.trim())}</p>
          <p>Jeżeli chcesz to wyjaśnić lub uzupełnić dokumenty — napisz na
          adres <a href="mailto:${u.emailKontaktowy || "sekretarz@emdr.org.pl"}">${u.emailKontaktowy || "sekretarz@emdr.org.pl"}</a>.</p>
          <p>Jeżeli rejestracja nie zostanie zamknięta pozytywnie,
          <b>otrzymasz zwrot wpłaconych środków</b>${
            wplacone > 0 ? ` (dotychczas wpłacono: ${formatujKwote(wplacone)})` : ""
          }.</p>
          ${stopka}
        </div>`,
      });
    } catch (e) {
      console.error("E-mail o odrzuceniu nie wyszedł:", e);
    }
    return Response.json({ ok: true, status: "odrzucone" });
  }

  /* ---- akceptacja: cicha (wewnętrzna kontrola dokumentów) ----
     status wg wpłat; termin płatności bez zmian — biegnie od zapisu */
  const brakuje = Math.max((z.kwotaNalezna || 0) - (z.wplacono || 0), 0);
  await payload.update({
    collection: "zgloszenia",
    id,
    data: { status: brakuje > 0 ? "oczekuje" : "potwierdzone" },
    overrideAccess: true,
  });
  return Response.json({ ok: true, status: brakuje > 0 ? "oczekuje" : "potwierdzone" });
}
