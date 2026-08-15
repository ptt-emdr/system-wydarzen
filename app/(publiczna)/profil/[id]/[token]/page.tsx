import { getPayload } from "payload";
import config from "@payload-config";
import { notFound } from "next/navigation";
import { formatujDate, formatujKwote } from "@/lib/wydarzenia";

export const dynamic = "force-dynamic";

/** Profil uczestnika — dostęp przez link tokenowy z e-maila (bez logowania). */
export default async function ProfilUczestnika({
  params,
}: {
  params: Promise<{ id: string; token: string }>;
}) {
  const { id, token } = await params;
  const payload = await getPayload({ config });

  let z: Record<string, unknown> & {
    token?: string;
    imie?: string;
    nazwisko?: string;
    status?: string;
    kwotaNalezna?: number;
    wplacono?: number;
    terminPlatnosci?: string;
    kodPlatnosci?: string;
    wybraneTerminy?: { nazwa: string }[];
    wydarzenie?: { tytul?: string; dataOd?: string; miejsce?: string } | number;
  };
  try {
    z = (await payload.findByID({
      collection: "zgloszenia",
      id,
      depth: 1,
      overrideAccess: true,
    })) as typeof z;
  } catch {
    notFound();
  }
  if (!z || !z.token || z.token !== token) notFound();

  const ustawienia = (await payload.findGlobal({ slug: "ustawienia" })) as {
    rachunek?: { numer?: string; odbiorca?: string };
    emailKontaktowy?: string;
  };
  const w = typeof z.wydarzenie === "object" ? z.wydarzenie : undefined;
  const doZaplaty = Math.max((z.kwotaNalezna || 0) - (z.wplacono || 0), 0);

  const statusInfo: Record<string, { tekst: string; klasa: string }> = {
    doAkceptacji: { tekst: "Czeka na weryfikację — nie dokonuj wpłaty", klasa: "bg-sun/70 text-ink" },
    odrzucone: { tekst: "Zgłoszenie odrzucone po weryfikacji", klasa: "bg-coral/80 text-white" },
    oczekuje: { tekst: "Oczekuje na wpłatę", klasa: "bg-sun text-ink" },
    potwierdzone: { tekst: "Potwierdzone — do zobaczenia!", klasa: "bg-brand text-white" },
    rezerwowa: { tekst: "Lista rezerwowa — nie dokonuj wpłaty", klasa: "bg-navy text-white" },
    obecny: { tekst: "Udział potwierdzony (obecność)", klasa: "bg-brand-deep text-white" },
    nieobecny: { tekst: "Odnotowano nieobecność", klasa: "bg-ink/60 text-white" },
    anulowane: { tekst: "Zgłoszenie anulowane", klasa: "bg-coral/80 text-white" },
  };
  const st = statusInfo[z.status || "oczekuje"];

  return (
    <section className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-dark">
        Twoje zgłoszenie
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-navy">
        {w?.tytul || "Wydarzenie PTT EMDR"}
      </h1>
      {w?.dataOd ? (
        <p className="mt-1 text-ink/70">
          {formatujDate(w.dataOd)}
          {w.miejsce ? ` · ${w.miejsce}` : ""}
        </p>
      ) : null}

      <div className={`mt-6 inline-block rounded-full px-5 py-2 font-bold ${st.klasa}`}>
        {st.tekst}
      </div>

      <dl className="mt-6 space-y-3 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
        <div className="flex justify-between gap-3">
          <dt className="text-ink/60">Uczestnik</dt>
          <dd className="font-semibold">
            {z.imie} {z.nazwisko}
          </dd>
        </div>
        {(z.wybraneTerminy || []).length > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-ink/60">Terminy</dt>
            <dd className="text-right font-semibold">
              {(z.wybraneTerminy || []).map((t) => t.nazwa).join(", ")}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="text-ink/60">Należność</dt>
          <dd className="font-semibold">{formatujKwote(z.kwotaNalezna || 0)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink/60">Wpłacono</dt>
          <dd className="font-semibold">{formatujKwote(z.wplacono || 0)}</dd>
        </div>
      </dl>

      {z.status === "oczekuje" && doZaplaty > 0 ? (
        <div className="mt-6 rounded-2xl bg-mist p-6">
          <h2 className="font-display text-xl font-semibold text-navy">Dane do przelewu</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink/60">Kwota</dt>
              <dd className="font-bold text-navy">{formatujKwote(doZaplaty)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink/60">Rachunek</dt>
              <dd className="font-semibold">{ustawienia.rachunek?.numer}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink/60">Odbiorca</dt>
              <dd className="whitespace-pre-line text-right">{ustawienia.rachunek?.odbiorca}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink/60">Tytuł przelewu</dt>
              <dd className="font-bold text-coral">{z.kodPlatnosci}</dd>
            </div>
            {z.terminPlatnosci ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink/60">Termin płatności</dt>
                <dd className="font-semibold">{formatujDate(z.terminPlatnosci, false)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}

      <p className="mt-6 text-sm text-ink/60">
        Pytania lub zmiana danych?{" "}
        <a className="underline hover:text-navy" href={`mailto:${ustawienia.emailKontaktowy || "sekretarz@emdr.org.pl"}`}>
          Napisz do organizatora
        </a>
        .
      </p>
    </section>
  );
}
