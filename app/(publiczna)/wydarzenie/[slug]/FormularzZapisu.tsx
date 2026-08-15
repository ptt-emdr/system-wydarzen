"use client";

import { useMemo, useState } from "react";

/* Formularz zapisu — buduje się z definicji pól wydarzenia (kreator
   w panelu). Wysyła multipart POST na /api/zapisy; po sukcesie pokazuje
   instrukcję płatności zwróconą przez serwer. */

type Pole = { etykieta: string; typ: string; wymagane?: boolean; opcje?: string | null };
type TerminInfo = { nazwa: string; data: string; cena: number; wolne: number | null; zamkniete: boolean };

type Props = {
  wydarzenie: {
    id: string;
    tytul: string;
    trybZapisu: "wydarzenie" | "terminy";
    cena: number;
    pola: Pole[];
    zbierajDaneFaktury: boolean;
    terminy: TerminInfo[];
    dniNaPlatnosc: number;
  };
  klauzulaRodo: string;
  trybRezerwowy?: boolean;
};

type Potwierdzenie = {
  kod: string;
  kwota: number;
  rachunek: string;
  odbiorca: string;
  terminPlatnosci: string | null;
  linkProfilu: string;
  bezplatne: boolean;
  rezerwowa?: boolean;
};

const kwota = (zl: number) => zl.toLocaleString("pl-PL", { minimumFractionDigits: 2 }) + " zł";

export function FormularzZapisu({ wydarzenie, klauzulaRodo, trybRezerwowy }: Props) {
  const [wybraneTerminy, setWybraneTerminy] = useState<string[]>([]);
  const [chceFakture, setChceFakture] = useState(false);
  const [wysylanie, setWysylanie] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [ok, setOk] = useState<Potwierdzenie | null>(null);

  const doZaplaty = useMemo(() => {
    if (wydarzenie.trybZapisu !== "terminy") return wydarzenie.cena;
    return wydarzenie.terminy
      .filter((t) => wybraneTerminy.includes(t.nazwa))
      .reduce((s, t) => s + t.cena, 0);
  }, [wydarzenie, wybraneTerminy]);

  async function wyslij(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBlad(null);
    if (wydarzenie.trybZapisu === "terminy" && wybraneTerminy.length === 0) {
      setBlad("Zaznacz co najmniej jeden termin.");
      return;
    }
    setWysylanie(true);
    try {
      const dane = new FormData(e.currentTarget);
      dane.set("wydarzenieId", wydarzenie.id);
      dane.set("terminy", JSON.stringify(wybraneTerminy));
      const odp = await fetch("/api/zapisy", { method: "POST", body: dane });
      const json = await odp.json();
      if (!odp.ok) throw new Error(json.blad || "Nie udało się wysłać zgłoszenia.");
      setOk(json as Potwierdzenie);
    } catch (err) {
      setBlad(err instanceof Error ? err.message : "Nie udało się wysłać zgłoszenia.");
    } finally {
      setWysylanie(false);
    }
  }

  if (ok) {
    return (
      <div className="rounded-2xl border border-brand/30 bg-mist p-6 shadow-soft">
        <h2 className="font-display text-2xl font-semibold text-navy">
          {ok.rezerwowa ? "Jesteś na liście rezerwowej" : "Dziękujemy — zgłoszenie przyjęte!"}
        </h2>
        {ok.rezerwowa ? (
          <p className="mt-3 text-ink/80">
            Limit miejsc jest wyczerpany, więc Twoje zgłoszenie trafiło na{" "}
            <b>listę rezerwową</b>. <b>Nie dokonuj jeszcze wpłaty.</b> Jeżeli
            zwolni się miejsce, otrzymasz e-mail z potwierdzeniem i danymi do
            przelewu.
          </p>
        ) : ok.bezplatne ? (
          <p className="mt-3 text-ink/80">
            Udział w wydarzeniu jest bezpłatny — Twoje miejsce jest już
            potwierdzone. Szczegóły wysłaliśmy na podany adres e-mail.
          </p>
        ) : (
          <>
            <p className="mt-3 text-ink/80">
              Aby potwierdzić udział, prosimy o przelew{" "}
              {ok.terminPlatnosci ? (
                <>
                  do <b>{ok.terminPlatnosci}</b>
                </>
              ) : null}
              :
            </p>
            <dl className="mt-4 space-y-2 rounded-xl bg-white p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink/60">Kwota</dt>
                <dd className="font-bold text-navy">{kwota(ok.kwota)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink/60">Rachunek</dt>
                <dd className="text-right font-semibold">{ok.rachunek}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink/60">Odbiorca</dt>
                <dd className="whitespace-pre-line text-right">{ok.odbiorca}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink/60">Tytuł przelewu</dt>
                <dd className="font-bold text-coral">{ok.kod}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-ink/70">
              Te same informacje wysłaliśmy e-mailem. Brak wpłaty w terminie
              oznacza zwolnienie miejsca.
            </p>
          </>
        )}
        <a
          href={ok.linkProfilu}
          className="mt-4 inline-block rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-deep"
        >
          Zobacz swoje zgłoszenie
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={wyslij}
      className="space-y-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-lift"
    >
      <h2 className="font-display text-2xl font-semibold text-navy">
        {trybRezerwowy ? "Zapisz się na listę rezerwową" : "Zapisz się"}
      </h2>

      {trybRezerwowy ? (
        <p className="rounded-xl border border-sun bg-sun/15 p-3 text-sm font-semibold text-ink">
          Miejsca na to wydarzenie są niedostępne — limit został wyczerpany.
          Zapisujesz się na <b>listę rezerwową</b>: nie płacisz teraz nic;
          jeżeli zwolni się miejsce, otrzymasz e-mail z potwierdzeniem
          i danymi do przelewu.
        </p>
      ) : null}

      {wydarzenie.trybZapisu === "terminy" ? (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-bold text-ink">
            Wybierz terminy <span className="text-coral">*</span>
          </legend>
          {wydarzenie.terminy.map((t) => (
            <label
              key={t.nazwa}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 text-sm transition ${
                t.zamkniete
                  ? "cursor-not-allowed border-ink/10 bg-ink/5 text-ink/40"
                  : wybraneTerminy.includes(t.nazwa)
                    ? "border-brand bg-mist"
                    : "border-ink/15 hover:border-brand/60"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={t.zamkniete}
                  checked={wybraneTerminy.includes(t.nazwa)}
                  onChange={(e) =>
                    setWybraneTerminy((s) =>
                      e.target.checked ? [...s, t.nazwa] : s.filter((x) => x !== t.nazwa),
                    )
                  }
                  className="h-4 w-4 accent-brand-deep"
                />
                {t.nazwa}
              </span>
              <span className="whitespace-nowrap font-semibold">{kwota(t.cena)}</span>
            </label>
          ))}
        </fieldset>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-1 block text-sm">
          <span className="font-bold">Imię <span className="text-coral">*</span></span>
          <input name="imie" required className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 outline-none transition focus:border-brand" />
        </label>
        <label className="col-span-1 block text-sm">
          <span className="font-bold">Nazwisko <span className="text-coral">*</span></span>
          <input name="nazwisko" required className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 outline-none transition focus:border-brand" />
        </label>
        <label className="col-span-2 block text-sm">
          <span className="font-bold">Adres e-mail <span className="text-coral">*</span></span>
          <input name="email" type="email" required className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 outline-none transition focus:border-brand" />
        </label>
        <label className="col-span-2 block text-sm">
          <span className="font-bold">Telefon</span>
          <input name="telefon" className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 outline-none transition focus:border-brand" />
        </label>
      </div>

      {wydarzenie.pola.map((p, i) =>
        p.typ === "info" ? (
          <p key={i} className="rounded-xl bg-cream p-3 text-sm text-ink/80">
            {p.opcje}
          </p>
        ) : (
          <label key={i} className="block text-sm">
            <span className="font-bold">
              {p.etykieta} {p.wymagane ? <span className="text-coral">*</span> : null}
            </span>
            {p.typ === "tekst" ? (
              <input name={`pole-${i}`} required={p.wymagane} className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 outline-none transition focus:border-brand" />
            ) : p.typ === "tekstDlugi" ? (
              <textarea name={`pole-${i}`} required={p.wymagane} rows={3} className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 outline-none transition focus:border-brand" />
            ) : p.typ === "lista" ? (
              <select name={`pole-${i}`} required={p.wymagane} className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 outline-none transition focus:border-brand">
                <option value="">— wybierz —</option>
                {(p.opcje || "").split("\n").filter(Boolean).map((o) => (
                  <option key={o} value={o.trim()}>{o.trim()}</option>
                ))}
              </select>
            ) : p.typ === "opcje" ? (
              <span className="mt-1 block space-y-1">
                {(p.opcje || "").split("\n").filter(Boolean).map((o) => (
                  <label key={o} className="flex items-center gap-2 font-normal">
                    <input type="radio" name={`pole-${i}`} value={o.trim()} required={p.wymagane} className="h-4 w-4 accent-brand-deep" />
                    {o.trim()}
                  </label>
                ))}
              </span>
            ) : p.typ === "checkbox" ? (
              <label className="mt-1 flex items-center gap-2 font-normal">
                <input type="checkbox" name={`pole-${i}`} value="tak" required={p.wymagane} className="h-4 w-4 accent-brand-deep" />
                Tak
              </label>
            ) : p.typ === "zalacznik" ? (
              <input
                type="file"
                name={`plik-${i}`}
                required={p.wymagane}
                accept=".pdf,.jpg,.jpeg,.png"
                className="mt-1 w-full rounded-lg border border-dashed border-ink/30 bg-mist/60 px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              />
            ) : null}
          </label>
        ),
      )}

      {wydarzenie.zbierajDaneFaktury ? (
        <div className="rounded-xl border border-ink/10 p-3">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              name="chceFakture"
              value="tak"
              checked={chceFakture}
              onChange={(e) => setChceFakture(e.target.checked)}
              className="h-4 w-4 accent-brand-deep"
            />
            Proszę o wystawienie faktury
          </label>
          {chceFakture ? (
            <div className="mt-3 space-y-2">
              <input name="fakturaNazwa" required placeholder="Nazwa firmy / imię i nazwisko" className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand" />
              <input name="fakturaNip" placeholder="NIP (dla firm)" className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand" />
              <input name="fakturaAdres" required placeholder="Adres: ulica, kod, miejscowość" className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand" />
            </div>
          ) : null}
        </div>
      ) : null}

      <label className="flex items-start gap-2 text-xs text-ink/70">
        <input type="checkbox" name="zgodaRodo" value="tak" required className="mt-0.5 h-4 w-4 shrink-0 accent-brand-deep" />
        <span>{klauzulaRodo}</span>
      </label>

      {blad ? (
        <p className="rounded-lg bg-coral/10 p-3 text-sm font-semibold text-coral">{blad}</p>
      ) : null}

      <button
        type="submit"
        disabled={wysylanie}
        className="w-full rounded-full bg-navy px-6 py-3 font-bold text-white shadow-soft transition hover:bg-brand-deep disabled:opacity-50"
      >
        {wysylanie
          ? "Wysyłanie…"
          : trybRezerwowy
            ? "Zapisuję się na listę rezerwową"
            : doZaplaty > 0
              ? `Zapisuję się — do zapłaty ${kwota(doZaplaty)}`
              : "Zapisuję się"}
      </button>
      {!trybRezerwowy && doZaplaty > 0 ? (
        <p className="text-center text-xs text-ink/60">
          Po zapisaniu otrzymasz dane do przelewu ({wydarzenie.dniNaPlatnosc}{" "}
          {wydarzenie.dniNaPlatnosc === 1 ? "dzień" : "dni"} na płatność).
        </p>
      ) : null}
    </form>
  );
}
