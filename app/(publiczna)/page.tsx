import { getPayload } from "payload";
import config from "@payload-config";
import Link from "next/link";
import {
  aktualnaCena,
  formatujDate,
  formatujKwote,
  type WydarzenieDoc,
} from "@/lib/wydarzenia";

export const revalidate = 300;

/** Lista opublikowanych wydarzeń — kafle w estetyce PTT. */
export default async function ListaWydarzen() {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "wydarzenia",
    where: { opublikowane: { equals: true } },
    sort: "dataOd",
    limit: 50,
    depth: 0,
  });
  const wydarzenia = docs as unknown as WydarzenieDoc[];

  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-5 pb-14 pt-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-dark">
            Zapisy online
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-navy sm:text-5xl">
            Nadchodzące <em className="italic text-brand-deep">wydarzenia</em>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">
            Szkolenia, superwizje i konferencje Polskiego Towarzystwa Terapii
            EMDR. Wybierz wydarzenie, aby poznać szczegóły i zapisać się online.
          </p>
        </div>
        <svg className="block w-full" viewBox="0 0 1440 56" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,56 C360,8 1080,8 1440,56 L1440,56 L0,56 Z" fill="#ffffff" />
        </svg>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10">
        {wydarzenia.length === 0 ? (
          <p className="rounded-2xl bg-mist p-8 text-center text-lg text-ink/70">
            W tej chwili nie prowadzimy zapisów — zajrzyj wkrótce.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {wydarzenia.map((w) => {
              const { cena, prog } = aktualnaCena(w);
              return (
                <Link
                  key={String(w.id)}
                  href={`/wydarzenie/${w.slug}`}
                  className="group rounded-2xl border border-ink/10 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-dark">
                    {formatujDate(w.dataOd, false)}
                    {w.miejsce ? ` · ${w.miejsce}` : ""}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-navy group-hover:text-brand-deep">
                    {w.tytul}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-ink/75">{w.opis}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="rounded-full bg-cream px-4 py-1.5 text-sm font-bold text-navy">
                      {w.cena === 0 && !prog
                        ? "Bezpłatne"
                        : `${formatujKwote(cena)}${prog ? ` · ${prog}` : ""}${w.trybZapisu === "terminy" ? " / termin" : ""}`}
                    </span>
                    <span className="text-sm font-semibold text-brand-deep transition group-hover:translate-x-1">
                      Szczegóły i zapisy →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
