import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import Link from "next/link";
import { formatujDate } from "@/lib/wydarzenia";

export const dynamic = "force-dynamic";

/** Lista wydarzeń → wejścia do Kart wydarzeń. */
export default async function ListaKart() {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  if (!user) {
    return (
      <p className="rounded-xl bg-white p-6 shadow-soft">
        Ta strona wymaga zalogowania —{" "}
        <a className="font-bold text-brand-deep underline" href="/admin">
          zaloguj się do panelu
        </a>{" "}
        i wróć tutaj.
      </p>
    );
  }
  const { docs } = await payload.find({
    collection: "wydarzenia",
    sort: "-dataOd",
    limit: 100,
    depth: 0,
    overrideAccess: true,
  });

  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-navy">Karty wydarzeń</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {docs.map((w) => {
          const d = w as { id: number; tytul: string; dataOd: string; opublikowane?: boolean; liczbaZapisanych?: string };
          return (
            <Link
              key={d.id}
              href={`/panel/wydarzenie/${d.id}`}
              className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-dark">
                {formatujDate(d.dataOd, false)} ·{" "}
                {d.opublikowane ? "opublikowane" : "szkic"}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-navy">{d.tytul}</h2>
              <p className="mt-2 text-sm text-ink/70">
                Zapisani: <b>{d.liczbaZapisanych}</b> · otwórz kartę →
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
