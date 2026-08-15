"use client";

import { useState } from "react";

/** Przycisk raportu należności: wysyła przypomnienia wszystkim nieopłaconym. */
export function PrzypomnijButton({
  wydarzenieId,
  liczba,
}: {
  wydarzenieId: string;
  liczba: number;
}) {
  const [stan, setStan] = useState<"spoczynek" | "pytanie" | "wysylka" | "gotowe" | "blad">(
    "spoczynek",
  );
  const [wyslano, setWyslano] = useState(0);

  async function wyslij() {
    setStan("wysylka");
    try {
      const r = await fetch("/api/przypomnienia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ wydarzenieId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.blad);
      setWyslano(j.wyslano);
      setStan("gotowe");
    } catch {
      setStan("blad");
    }
  }

  if (stan === "gotowe")
    return (
      <p className="rounded-xl bg-brand/10 p-3 text-sm font-semibold text-brand-deep">
        Wysłano przypomnienia: {wyslano}. Odśwież stronę za chwilę, aby zobaczyć zmiany.
      </p>
    );
  if (stan === "pytanie")
    return (
      <span className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold">
          Wysłać e-mail z przypomnieniem o płatności do {liczba} os.?
        </span>
        <button onClick={wyslij} className="rounded-full bg-coral px-5 py-2 text-sm font-bold text-white hover:opacity-90">
          Tak, wyślij
        </button>
        <button onClick={() => setStan("spoczynek")} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-ink/70 shadow-soft">
          Anuluj
        </button>
      </span>
    );
  return (
    <button
      onClick={() => setStan("pytanie")}
      disabled={stan === "wysylka"}
      className="rounded-full bg-sun px-5 py-2.5 text-sm font-bold text-ink shadow-soft hover:brightness-95 disabled:opacity-50"
    >
      {stan === "wysylka"
        ? "Wysyłanie…"
        : stan === "blad"
          ? "Błąd — spróbuj ponownie"
          : `Wyślij przypomnienie o płatności (${liczba} os.)`}
    </button>
  );
}
