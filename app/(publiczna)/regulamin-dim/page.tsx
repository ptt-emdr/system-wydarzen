import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulamin Programu Superwizyjnego EMDR C&A",
  robots: { index: false, follow: false },
};

/**
 * Strona regulaminu 2-letniego Programu Superwizyjnego EMDR DiM.
 * Do czasu zatwierdzenia regulaminu — placeholder (decyzja 06.09.2026:
 * treść regulaminu zostanie dodana przed publicznym udostępnieniem
 * wydarzenia).
 */
export default function RegulaminDim() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-dark">
        Program Superwizyjny EMDR C&amp;A
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
        Regulamin programu
      </h1>
      <div className="mt-8 rounded-2xl bg-mist p-8 text-lg leading-relaxed text-ink/80">
        <p className="font-semibold text-navy">Regulamin wkrótce.</p>
        <p className="mt-3">
          Pełna treść regulaminu 2-letniego Programu Superwizyjnego EMDR
          w Terapii Dzieci i Młodzieży zostanie opublikowana na tej stronie
          przed rozpoczęciem programu. Szczegółowe zasady udziału,
          harmonogram, ostateczne koszty i warunki rezygnacji zostaną
          przedstawione uczestnikom przed zawarciem umowy.
        </p>
        <p className="mt-3">
          Pytania dotyczące programu:{" "}
          <a
            className="font-semibold text-brand-deep underline underline-offset-2"
            href="mailto:dim@emdr.org.pl"
          >
            dim@emdr.org.pl
          </a>
          .
        </p>
      </div>
    </section>
  );
}
