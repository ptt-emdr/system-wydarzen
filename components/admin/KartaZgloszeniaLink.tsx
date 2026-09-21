"use client";

import { useDocumentInfo } from "@payloadcms/ui";

/** Link do karty zgłoszenia do wydruku / zapisu PDF (segregator). */
export function KartaZgloszeniaLink() {
  const { id } = useDocumentInfo();
  if (!id) return null;
  return (
    <a
      href={`/karta-zgloszenia/${id}`}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "block",
        marginBottom: "16px",
        padding: "10px 16px",
        borderRadius: "8px",
        background: "#1d3d76",
        color: "#fff",
        fontWeight: 700,
        fontSize: "13px",
        textAlign: "center",
        textDecoration: "none",
      }}
    >
      🖨 Karta zgłoszenia — PDF / wydruk ↗
    </a>
  );
}
