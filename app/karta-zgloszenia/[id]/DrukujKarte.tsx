"use client";

/** Zapis karty jako PDF / wydruk — przez systemowe okno drukowania. */
export function DrukujKarte() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: "10px 18px",
        borderRadius: "999px",
        border: "none",
        background: "#1d3d76",
        color: "#fff",
        fontWeight: 700,
        fontSize: "13px",
        cursor: "pointer",
      }}
    >
      🖨 Drukuj / zapisz jako PDF
    </button>
  );
}
