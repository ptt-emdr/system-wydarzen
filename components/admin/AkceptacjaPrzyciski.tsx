"use client";

import { useState } from "react";
import { useDocumentInfo, useFormFields } from "@payloadcms/ui";

/**
 * Przyciski „Akceptuj uczestnika" / „Odrzuć uczestnika" na karcie
 * zgłoszenia — widoczne tylko przy statusie „Do akceptacji".
 * Odrzucenie wymaga wpisania (lub wybrania) krótkiego powodu,
 * który trafia w e-mailu do uczestnika.
 */
const GOTOWE_POWODY = [
  "Niewłaściwy dokument",
  "Nieczytelny załącznik — prosimy o ponowne zgłoszenie",
  "Brak wymaganych uprawnień/certyfikatu",
];

export function AkceptacjaPrzyciski() {
  const { id } = useDocumentInfo();
  const status = useFormFields(([fields]) => fields?.status?.value as string);
  const [tryb, setTryb] = useState<"start" | "odrzucanie" | "wysylka" | "gotowe">("start");
  const [powod, setPowod] = useState("");
  const [blad, setBlad] = useState("");

  if (!id || status !== "doAkceptacji" || tryb === "gotowe") return null;

  async function decyzja(jaka: "akceptuj" | "odrzuc") {
    setBlad("");
    if (jaka === "odrzuc" && !powod.trim()) {
      setBlad("Wpisz powód odrzucenia — zostanie wysłany uczestnikowi.");
      return;
    }
    setTryb("wysylka");
    try {
      const r = await fetch("/api/akceptacja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, decyzja: jaka, komentarz: powod.trim() }),
      });
      if (!r.ok) throw new Error((await r.json()).blad);
      setTryb("gotowe");
      window.location.reload();
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Błąd — spróbuj ponownie.");
      setTryb(powod ? "odrzucanie" : "start");
    }
  }

  const przycisk: React.CSSProperties = {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "12px",
        borderRadius: "8px",
        border: "2px solid #fbbb15",
        background: "var(--theme-elevation-50, #fffbe8)",
      }}
    >
      <b>Zgłoszenie czeka na weryfikację</b>
      {tryb !== "odrzucanie" ? (
        <>
          <button
            type="button"
            style={{ ...przycisk, background: "#2c667f", color: "#fff" }}
            disabled={tryb === "wysylka"}
            onClick={() => decyzja("akceptuj")}
          >
            ✓ Akceptuj uczestnika
          </button>
          <button
            type="button"
            style={{ ...przycisk, background: "#fff", color: "#c22", border: "1px solid #c22" }}
            disabled={tryb === "wysylka"}
            onClick={() => setTryb("odrzucanie")}
          >
            ✕ Odrzuć uczestnika…
          </button>
        </>
      ) : (
        <>
          <label style={{ fontSize: "13px", fontWeight: 600 }}>
            Powód odrzucenia (trafi do uczestnika):
          </label>
          <select
            value={GOTOWE_POWODY.includes(powod) ? powod : ""}
            onChange={(e) => setPowod(e.target.value)}
            style={{ padding: "8px", borderRadius: "6px" }}
          >
            <option value="">— wybierz lub wpisz poniżej —</option>
            {GOTOWE_POWODY.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            value={powod}
            onChange={(e) => setPowod(e.target.value)}
            placeholder="…albo wpisz własny powód"
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #bbb" }}
          />
          <button
            type="button"
            style={{ ...przycisk, background: "#c22", color: "#fff" }}
            onClick={() => decyzja("odrzuc")}
          >
            Odrzuć i wyślij powód
          </button>
          <button
            type="button"
            style={{ ...przycisk, background: "transparent", color: "#666", border: "1px solid #bbb" }}
            onClick={() => setTryb("start")}
          >
            Wróć
          </button>
        </>
      )}
      {blad ? <span style={{ color: "#c22", fontSize: "13px" }}>{blad}</span> : null}
    </div>
  );
}
