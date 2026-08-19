import { getPayload } from "payload";
import config from "@payload-config";
import { eskapujHtml, formatujKwote } from "@/lib/wydarzenia";

/**
 * Wysyłka przypomnień o płatności do wszystkich nieopłaconych zgłoszeń
 * wydarzenia (status „oczekuje”, saldo > 0). Tylko dla zalogowanej obsługi.
 */
export async function POST(req: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return Response.json({ blad: "Wymagane logowanie." }, { status: 403 });

  const { wydarzenieId } = (await req.json()) as { wydarzenieId?: string };
  if (!wydarzenieId) return Response.json({ blad: "Brak wydarzenia." }, { status: 400 });

  const w = (await payload.findByID({
    collection: "wydarzenia",
    id: wydarzenieId,
    depth: 0,
    overrideAccess: true,
  })) as { tytul: string };
  const u = (await payload.findGlobal({ slug: "ustawienia" })) as {
    rachunek?: { numer?: string; odbiorca?: string };
    emailKontaktowy?: string;
  };

  const { docs } = await payload.find({
    collection: "zgloszenia",
    where: {
      and: [
        { wydarzenie: { equals: wydarzenieId } },
        { status: { in: ["oczekuje", "doAkceptacji"] } },
      ],
    },
    limit: 2000,
    depth: 0,
    overrideAccess: true,
  });

  let wyslano = 0;
  for (const z of docs as {
    email: string; imie: string; kwotaNalezna?: number; wplacono?: number;
    kodPlatnosci?: string; terminPlatnosci?: string; token?: string; id: number | string;
  }[]) {
    const brakuje = Math.max((z.kwotaNalezna || 0) - (z.wplacono || 0), 0);
    if (brakuje <= 0) continue;
    const termin = z.terminPlatnosci
      ? new Date(z.terminPlatnosci).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })
      : null;
    const bazaUrl = process.env.PUBLIC_URL || "http://localhost:3100";
    try {
      await payload.sendEmail({
        to: z.email,
        subject: `Przypomnienie o płatności: ${w.tytul}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#16303c;line-height:1.5">
          <p>Dzień dobry ${eskapujHtml(z.imie)},</p>
          <p>przypominamy o płatności za udział w <b>${w.tytul}</b>${termin ? ` — termin płatności: <b>${termin}</b>` : ""}.</p>
          <table cellpadding="6" style="border-collapse:collapse;background:#f7f3e6;border-radius:8px">
            <tr><td>Do zapłaty</td><td><b>${formatujKwote(brakuje)}</b></td></tr>
            <tr><td>Rachunek</td><td><b>${u.rachunek?.numer || ""}</b></td></tr>
            <tr><td>Odbiorca</td><td>${(u.rachunek?.odbiorca || "").replace(/\n/g, "<br>")}</td></tr>
            <tr><td>Tytuł przelewu</td><td><b style="color:#ff370f">${z.kodPlatnosci || ""}</b></td></tr>
          </table>
          <p>Brak wpłaty w terminie oznacza zwolnienie miejsca. Jeżeli przelew
          został już wykonany — prosimy zignorować to przypomnienie.</p>
          <p>Stan zgłoszenia: <a href="${bazaUrl}/profil/${z.id}/${z.token}">${bazaUrl}/profil/${z.id}/${z.token}</a></p>
          <p>W razie pytań: ${u.emailKontaktowy || "sekretarz@emdr.org.pl"}</p>
        </div>`,
      });
      wyslano++;
    } catch (e) {
      console.error("Przypomnienie nie wyszło do", z.email, e);
    }
  }
  return Response.json({ wyslano });
}
