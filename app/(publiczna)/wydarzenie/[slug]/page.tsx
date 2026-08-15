import { getPayload } from "payload";
import config from "@payload-config";
import { notFound } from "next/navigation";
import {
  aktualnaCena,
  formatujDate,
  formatujKwote,
  zajetosc,
  type WydarzenieDoc,
} from "@/lib/wydarzenia";
import { FormularzZapisu } from "./FormularzZapisu";

export const dynamic = "force-dynamic"; // wolne miejsca zawsze aktualne

/** Strona wydarzenia: opis + terminy + formularz zapisu. */
export default async function StronaWydarzenia({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "wydarzenia",
    where: {
      and: [{ slug: { equals: slug } }, { opublikowane: { equals: true } }],
    },
    limit: 1,
    depth: 0,
  });
  const w = docs[0] as unknown as WydarzenieDoc | undefined;
  if (!w) notFound();

  const ustawienia = await payload.findGlobal({ slug: "ustawienia" });
  const { lacznie, naTermin } = await zajetosc(payload, w.id);
  const { cena, prog } = aktualnaCena(w);
  const teraz = new Date();

  /* wolne miejsca do przekazania formularzowi */
  const terminyInfo = (w.terminy || []).map((t) => {
    const zajete = naTermin[t.nazwa] || 0;
    const wolne = t.limit ? Math.max(t.limit - zajete, 0) : null;
    const zamkniete =
      (t.zapisyDo && teraz > new Date(t.zapisyDo)) || (wolne !== null && wolne === 0);
    return { nazwa: t.nazwa, data: t.data, cena: t.cenaTerminu ?? cena, wolne, zamkniete };
  });
  const wolneWydarzenia = w.limitMiejsc ? Math.max(w.limitMiejsc - lacznie, 0) : null;
  const brakMiejsc = w.trybZapisu === "wydarzenie" && wolneWydarzenia === 0;

  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-5 pb-12 pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-dark">
            {formatujDate(w.dataOd)}
            {w.dataDo ? ` – ${formatujDate(w.dataDo)}` : ""}
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-3xl font-semibold text-navy sm:text-4xl">
            {w.tytul}
          </h1>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            {w.miejsce ? (
              <span className="rounded-full bg-white px-4 py-1.5 text-ink/80 shadow-soft">
                📍 {w.miejsce}
              </span>
            ) : null}
            <span className="rounded-full bg-navy px-4 py-1.5 text-white shadow-soft">
              {w.cena === 0 && !w.progiCenowe?.length
                ? "Udział bezpłatny"
                : `${formatujKwote(cena)}${prog ? ` — ${prog}` : ""}${w.trybZapisu === "terminy" ? " za termin" : ""}`}
            </span>
            {wolneWydarzenia !== null ? (
              <span className="rounded-full bg-sun px-4 py-1.5 text-ink shadow-soft">
                Wolne miejsca: {wolneWydarzenia}
              </span>
            ) : null}
          </div>
        </div>
        <svg className="block w-full" viewBox="0 0 1440 56" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,56 C360,8 1080,8 1440,56 L1440,56 L0,56 Z" fill="#ffffff" />
        </svg>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-10 lg:grid-cols-[1fr_420px]">
        <article className="space-y-4 text-lg leading-relaxed text-ink/85">
          {w.opis.split(/\n\s*\n/).map((akapit, i) => (
            <p key={i}>{akapit}</p>
          ))}
          {w.trybZapisu === "terminy" && terminyInfo.length > 0 ? (
            <div className="mt-6 rounded-2xl bg-mist p-6">
              <h2 className="font-display text-xl font-semibold text-navy">
                Terminy w tym cyklu
              </h2>
              <ul className="mt-3 space-y-2 text-base">
                {terminyInfo.map((t) => (
                  <li key={t.nazwa} className="flex items-baseline justify-between gap-3">
                    <span>
                      {t.nazwa}
                      {t.zamkniete ? (
                        <em className="ml-2 text-sm text-coral">zapisy zamknięte</em>
                      ) : t.wolne !== null ? (
                        <em className="ml-2 text-sm text-ink/60">wolne: {t.wolne}</em>
                      ) : null}
                    </span>
                    <span className="whitespace-nowrap font-semibold text-navy">
                      {formatujKwote(t.cena)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>

        <aside>
          {brakMiejsc ? (
            <div className="rounded-2xl border border-coral/30 bg-coral/5 p-6 text-center">
              <p className="font-display text-xl font-semibold text-navy">Brak wolnych miejsc</p>
              <p className="mt-2 text-ink/70">
                Limit miejsc został osiągnięty. Napisz do nas — dodamy Cię do listy rezerwowej.
              </p>
            </div>
          ) : (
            <FormularzZapisu
              wydarzenie={{
                id: String(w.id),
                tytul: w.tytul,
                trybZapisu: w.trybZapisu,
                cena,
                pola: w.pola || [],
                zbierajDaneFaktury: w.zbierajDaneFaktury !== false,
                terminy: terminyInfo,
                dniNaPlatnosc: w.dniNaPlatnosc,
              }}
              klauzulaRodo={(ustawienia as { klauzulaRodo?: string }).klauzulaRodo || ""}
            />
          )}
        </aside>
      </section>
    </>
  );
}
