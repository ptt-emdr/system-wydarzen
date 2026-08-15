"use client";

import { useEffect, useState } from "react";

/**
 * Pasek nad listą Zgłoszeń w panelu: wybór wydarzenia (filtruje listę)
 * + licznik aktualnie zapisanych na wybrane wydarzenie.
 */
type Wydarzenie = { id: number | string; tytul: string };
type Liczby = { zapisani: number; potwierdzeni: number; oczekuja: number; limit: number | null };

export function FiltrZgloszen() {
  const [wydarzenia, setWydarzenia] = useState<Wydarzenie[]>([]);
  const [wybrane, setWybrane] = useState<string>("");
  const [liczby, setLiczby] = useState<Liczby | null>(null);

  /* lista wydarzeń + odczyt aktywnego filtra z adresu */
  useEffect(() => {
    fetch("/api/wydarzenia?limit=200&sort=-dataOd&depth=0", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setWydarzenia(d.docs || []));
    const m = decodeURIComponent(window.location.search).match(
      /\[wydarzenie\]\[equals\]=([^&]+)/,
    );
    if (m) setWybrane(m[1]);
  }, []);

  /* liczniki dla wybranego wydarzenia */
  useEffect(() => {
    if (!wybrane) {
      setLiczby(null);
      return;
    }
    const zapytaj = async (dodatkowo: string) => {
      const r = await fetch(
        `/api/zgloszenia?limit=0&where[wydarzenie][equals]=${wybrane}${dodatkowo}`,
        { credentials: "include" },
      );
      return (await r.json()).totalDocs as number;
    };
    (async () => {
      const [zapisani, potwierdzeni, anulowani] = await Promise.all([
        zapytaj("&where[status][not_equals]=anulowane"),
        zapytaj("&where[status][in]=potwierdzone,obecny"),
        zapytaj("&where[status][equals]=anulowane"),
      ]);
      const w = await fetch(`/api/wydarzenia/${wybrane}?depth=0`, { credentials: "include" }).then(
        (r) => r.json(),
      );
      void anulowani;
      setLiczby({
        zapisani,
        potwierdzeni,
        oczekuja: zapisani - potwierdzeni,
        limit: w.limitMiejsc || null,
      });
    })();
  }, [wybrane]);

  function zmienFiltr(id: string) {
    setWybrane(id);
    const baza = window.location.pathname;
    window.location.href = id
      ? `${baza}?where[or][0][and][0][wydarzenie][equals]=${id}`
      : baza;
  }

  const ramka: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    marginBottom: "12px",
    borderRadius: "8px",
    background: "var(--theme-elevation-50, #f4f4f4)",
    border: "1px solid var(--theme-elevation-150, #ddd)",
  };

  return (
    <div style={ramka}>
      <label style={{ fontWeight: 600 }}>
        Wydarzenie:{" "}
        <select
          value={wybrane}
          onChange={(e) => zmienFiltr(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: "6px", maxWidth: "420px" }}
        >
          <option value="">— wszystkie wydarzenia —</option>
          {wydarzenia.map((w) => (
            <option key={String(w.id)} value={String(w.id)}>
              {w.tytul}
            </option>
          ))}
        </select>
      </label>
      {wybrane && liczby ? (
        <span>
          <b>Zapisanych: {liczby.zapisani}</b>
          {liczby.limit ? ` / limit ${liczby.limit}` : ""} · opłaconych:{" "}
          {liczby.potwierdzeni} · oczekuje na wpłatę: {liczby.oczekuja}
        </span>
      ) : null}
    </div>
  );
}
