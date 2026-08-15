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
      <span style={{ fontWeight: 600 }}>
        Podsumowania, finanse i raporty wydarzeń znajdziesz na Kartach wydarzeń:
      </span>
      <a
        href="/panel"
        style={{
          padding: "6px 14px",
          borderRadius: "999px",
          background: "#1d3d76",
          color: "#fff",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Otwórz Karty wydarzeń →
      </a>
    </div>
  );
}
