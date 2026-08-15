"use client";

/** Pasek nad listą Wydarzeń: wejście do Kart wydarzeń (dashboard + raporty). */
export function LinkPanelu() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        marginBottom: "12px",
        borderRadius: "8px",
        background: "var(--theme-elevation-50, #f4f4f4)",
        border: "1px solid var(--theme-elevation-150, #ddd)",
      }}
    >
      <a
        href="/admin/collections/wydarzenia/create"
        style={{
          padding: "10px 22px",
          borderRadius: "999px",
          background: "#fbbb15",
          color: "#16303c",
          fontWeight: 800,
          fontSize: "15px",
          textDecoration: "none",
          boxShadow: "0 2px 8px rgba(22,48,60,.2)",
        }}
      >
        ＋ Dodaj wydarzenie
      </a>
      <span style={{ fontWeight: 600, marginLeft: "auto" }}>
        Podsumowania, finanse i raporty:
      </span>
      <a
        href="/panel"
        target="_blank"
        rel="noopener"
        style={{
          padding: "8px 16px",
          borderRadius: "999px",
          background: "#1d3d76",
          color: "#fff",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Otwórz Karty wydarzeń ↗
      </a>
    </div>
  );
}
