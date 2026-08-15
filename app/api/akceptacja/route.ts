import { getPayload } from "payload";
import config from "@payload-config";
import { formatujKwote } from "@/lib/wydarzenia";

/**
 * Decyzja o zgłoszeniu w trybie „Akceptowanie uczestników":
 *  - akceptuj → status „oczekuje" (lub „potwierdzone" przy kwocie 0),
 *    termin płatności liczony OD AKCEPTACJI, e-mail z danymi przelewu;
 *  - odrzuc → status „odrzucone" + powód, e-mail z powodem.
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
    try {
      await payload.sendEmail({
        to: z.email,
        subject: `Zgłoszenie odrzucone: ${w.tytul}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#16303c;line-height:1.5">
          <p>Dzień dobry ${z.imie},</p>
          <p>niestety Twoje zgłoszenie na <b>${w.tytul}</b> zostało odrzucone
          na etapie weryfikacji.</p>
          <p><b>Powód:</b> ${komentarz!.trim()}</p>
          <p>Jeżeli to nieporozumienie lub możesz uzupełnić dokumenty —
          napisz do nas albo zarejestruj się ponownie.</p>
          ${stopka}
        </div>`,
      });
    } catch (e) {
      console.error("E-mail o odrzuceniu nie wyszedł:", e);
    }
    return Response.json({ ok: true, status: "odrzucone" });
  }

  /* ---- akceptacja ---- */
  const kwota = z.kwotaNalezna || 0;
  const brakuje = Math.max(kwota - (z.wplacono || 0), 0);
  const dni = w.dniNaPlatnosc || 3;
  const termin = brakuje > 0 ? new Date(Date.now() + dni * 24 * 60 * 60 * 1000) : null;
  await payload.update({
    collection: "zgloszenia",
    id,
    data: {
      status: brakuje > 0 ? "oczekuje" : "potwierdzone",
      ...(termin ? { terminPlatnosci: termin.toISOString() } : {}),
    },
    overrideAccess: true,
  });
  const terminTekst = termin
    ? termin.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })
    : null;
  try {
    await payload.sendEmail({
      to: z.email,
      subject: `Zgłoszenie zaakceptowane: ${w.tytul}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#16303c;line-height:1.5">
        <p>Dzień dobry ${z.imie},</p>
        <p>Twoje zgłoszenie na <b>${w.tytul}</b> zostało pozytywnie
        zweryfikowane i <b>zaakceptowane</b>.</p>
        ${
          brakuje > 0
            ? `<p>Aby potwierdzić udział, prosimy o przelew${terminTekst ? ` do <b>${terminTekst}</b>` : ""}:</p>
               <table cellpadding="6" style="border-collapse:collapse;background:#f7f3e6;border-radius:8px">
                 <tr><td>Kwota</td><td><b>${formatujKwote(brakuje)}</b></td></tr>
                 <tr><td>Rachunek</td><td><b>${u.rachunek?.numer || ""}</b></td></tr>
                 <tr><td>Odbiorca</td><td>${(u.rachunek?.odbiorca || "").replace(/\n/g, "<br>")}</td></tr>
                 <tr><td>Tytuł przelewu</td><td><b style="color:#ff370f">${z.kodPlatnosci || ""}</b></td></tr>
               </table>
               <p>Brak wpłaty w terminie oznacza zwolnienie miejsca.</p>`
            : `<p>Udział jest bezpłatny — Twoje miejsce jest potwierdzone.</p>`
        }
        ${stopka}
      </div>`,
    });
  } catch (e) {
    console.error("E-mail o akceptacji nie wyszedł:", e);
  }
  return Response.json({ ok: true, status: brakuje > 0 ? "oczekuje" : "potwierdzone" });
}
