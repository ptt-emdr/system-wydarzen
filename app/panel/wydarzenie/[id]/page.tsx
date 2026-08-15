import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { statystykiWydarzenia } from "@/lib/raporty";
import { zajetosc, formatujDate, formatujKwote, type WydarzenieDoc } from "@/lib/wydarzenia";
import { PrzypomnijButton } from "./PrzypomnijButton";
import { DrukujButton } from "./DrukujButton";

export const dynamic = "force-dynamic";

/** KARTA WYDARZENIA — Dashboard (Raport 1) + należności (Raport 5) + eksporty. */
export default async function KartaWydarzenia({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  let w: WydarzenieDoc & { typ?: string; listaRezerwowa?: boolean; opublikowane?: boolean };
  try {
    w = (await payload.findByID({
      collection: "wydarzenia",
      id,
      depth: 0,
      overrideAccess: true,
    })) as typeof w;
  } catch {
    notFound();
  }
  const s = await statystykiWydarzenia(payload, id);
  const { naTermin } = await zajetosc(payload, id);
  const wolne = w.limitMiejsc ? Math.max(w.limitMiejsc - s.zapisani, 0) : null;
  const filtrListy = `/admin/collections/zgloszenia?where[or][0][and][0][wydarzenie][equals]=${id}`;

  const Kafel = ({ etykieta, wartosc, wyroznij }: { etykieta: string; wartosc: string | number; wyroznij?: boolean }) => (
    <div className={`rounded-xl p-4 ${wyroznij ? "bg-navy text-white" : "bg-white"} shadow-soft`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${wyroznij ? "text-white/70" : "text-ink/60"}`}>
        {etykieta}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold">{wartosc}</p>
    </div>
  );

  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-dark">
        Karta wydarzenia · {w.typ || "wydarzenie"} · {w.opublikowane ? "opublikowane" : "szkic"}
      </p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mt-1 font-display text-3xl font-semibold text-navy">{w.tytul}</h1>
          <p className="mt-1 text-ink/70">
            {formatujDate(w.dataOd)}
            {w.miejsce ? ` · ${w.miejsce}` : ""}
          </p>
          <p className="mt-1 text-xs text-ink/50">
            Raport wygenerowany:{" "}
            {new Date().toLocaleString("pl-PL", {
              day: "numeric", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <DrukujButton />
      </div>

      {/* ---------- zakładki (kolejne dochodzą z F2/F3/F4) ---------- */}
      <nav className="bez-druku mt-5 flex flex-wrap gap-2 text-sm font-semibold">
        <span className="rounded-full bg-navy px-4 py-1.5 text-white">Podsumowanie</span>
        <a href={filtrListy} className="rounded-full bg-white px-4 py-1.5 text-brand-deep shadow-soft hover:bg-cream">
          Uczestnicy →
        </a>
        <a href={`/admin/collections/wydarzenia/${id}`} className="rounded-full bg-white px-4 py-1.5 text-brand-deep shadow-soft hover:bg-cream">
          Ustawienia →
        </a>
        <a href={`/wydarzenie/${w.slug}`} target="_blank" className="rounded-full bg-white px-4 py-1.5 text-brand-deep shadow-soft hover:bg-cream">
          Strona wydarzenia ↗
        </a>
      </nav>

      {/* ---------- miejsca i uczestnicy ---------- */}
      <h2 className="mt-8 font-display text-xl font-semibold text-navy">Miejsca i uczestnicy</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kafel etykieta="Limit miejsc" wartosc={w.limitMiejsc ?? "—"} />
        <Kafel etykieta="Zapisani" wartosc={s.zapisani} wyroznij />
        <Kafel etykieta="Wolne miejsca" wartosc={wolne ?? "—"} />
        <Kafel etykieta="Lista rezerwowa" wartosc={s.rezerwowa} />
        <Kafel etykieta="Do akceptacji" wartosc={s.doAkceptacji} />
        <Kafel etykieta="Oczekują na wpłatę" wartosc={s.oczekuja} />
        <Kafel etykieta="Opłaceni" wartosc={s.oplaceni} />
        <Kafel etykieta="Anulowani / odrzuceni" wartosc={`${s.anulowani} / ${s.odrzuceni}`} />
        <Kafel etykieta="Obecni / nieobecni" wartosc={`${s.obecni} / ${s.nieobecni}`} />
      </div>

      {/* ---------- finanse ---------- */}
      <h2 className="mt-8 font-display text-xl font-semibold text-navy">Finanse</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kafel etykieta="Przychód oczekiwany" wartosc={formatujKwote(s.przychodOczekiwany)} />
        <Kafel etykieta="Wpłaty zaksięgowane" wartosc={formatujKwote(s.wplatyZaksiegowane)} wyroznij />
        <Kafel etykieta="Należności" wartosc={formatujKwote(s.naleznosci)} />
        <Kafel etykieta="Zwroty" wartosc={formatujKwote(s.zwroty)} />
      </div>
      {s.nadplaty > 0 ? (
        <p className="mt-2 text-sm text-ink/70">
          Nadpłaty do wyjaśnienia: <b>{formatujKwote(s.nadplaty)}</b>
        </p>
      ) : null}
      <p className="mt-2 text-sm text-ink/60">
        Prosi o fakturę: {s.fakturNaProsbe} os. · wartość rejestracji (z anulowanymi):{" "}
        {formatujKwote(s.wartoscRejestracji)}
      </p>

      {/* ---------- terminy cyklu ---------- */}
      {w.trybZapisu === "terminy" && (w.terminy || []).length > 0 ? (
        <>
          <h2 className="mt-8 font-display text-xl font-semibold text-navy">Terminy</h2>
          <div className="mt-3 overflow-x-auto rounded-xl bg-white p-4 shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-left text-ink/60">
                  <th className="py-1 pr-3">Termin</th>
                  <th className="py-1 pr-3">Zapisani</th>
                  <th className="py-1">Limit</th>
                </tr>
              </thead>
              <tbody>
                {(w.terminy || []).map((t) => (
                  <tr key={t.nazwa} className="border-b border-ink/5">
                    <td className="py-1.5 pr-3">{t.nazwa}</td>
                    <td className="py-1.5 pr-3 font-semibold">{naTermin[t.nazwa] || 0}</td>
                    <td className="py-1.5">{t.limit ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {/* ---------- należności (Raport 5) ---------- */}
      <h2 className="mt-8 font-display text-xl font-semibold text-navy">
        Należności — kto jeszcze powinien zapłacić?
      </h2>
      {s.nieoplaceni.length === 0 ? (
        <p className="mt-3 rounded-xl bg-white p-4 text-ink/70 shadow-soft">
          Wszyscy zapisani mają uregulowane płatności. 🎉
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink/70">
            {s.nieoplaceni.length} os. nie zapłaciło (łącznie{" "}
            <b>{formatujKwote(s.naleznosci)}</b>) · po terminie:{" "}
            <b className="text-coral">{s.poTerminie}</b> · w terminie: {s.wTerminie}
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl bg-white p-4 shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-left text-ink/60">
                  <th className="py-1 pr-3">Uczestnik</th>
                  <th className="py-1 pr-3">E-mail</th>
                  <th className="py-1 pr-3">Brakuje</th>
                  <th className="py-1">Termin płatności</th>
                </tr>
              </thead>
              <tbody>
                {s.nieoplaceni.map((n) => (
                  <tr key={String(n.id)} className="border-b border-ink/5">
                    <td className="py-1.5 pr-3">
                      <a className="font-semibold text-brand-deep hover:underline" href={`/admin/collections/zgloszenia/${n.id}`}>
                        {n.kto}
                      </a>
                    </td>
                    <td className="py-1.5 pr-3">{n.email}</td>
                    <td className="py-1.5 pr-3 font-semibold">{formatujKwote(n.brakuje)}</td>
                    <td className={`py-1.5 ${n.przekroczony ? "font-bold text-coral" : ""}`}>
                      {n.terminPlatnosci ? formatujDate(n.terminPlatnosci, false) : "—"}
                      {n.przekroczony ? " (po terminie)" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bez-druku mt-3">
            <PrzypomnijButton wydarzenieId={String(w.id)} liczba={s.nieoplaceni.length} />
          </div>
        </>
      )}

      {/* ---------- eksporty ---------- */}
      <h2 className="bez-druku mt-8 font-display text-xl font-semibold text-navy">
        Raporty do pobrania
      </h2>
      <div className="bez-druku mt-3 flex flex-wrap gap-3">
        <a href={`/api/eksport?wydarzenie=${id}&format=xlsx`} className="rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-brand-deep">
          Uczestnicy — Excel (XLSX)
        </a>
        <a href={`/api/eksport?wydarzenie=${id}`} className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-deep shadow-soft hover:bg-cream">
          Uczestnicy — CSV
        </a>
      </div>
    </>
  );
}
