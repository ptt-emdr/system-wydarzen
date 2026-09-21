"use client";

import { useEffect, useState } from "react";
import { useFormFields } from "@payloadcms/ui";

/**
 * Podgląd załączników zgłoszenia: lista plików z przyciskiem
 * „Zobacz załącznik" (otwiera plik w nowej karcie). Pliki są serwowane
 * przez API z kontrolą dostępu — działa tylko po zalogowaniu do panelu.
 */
type Zalacznik = {
  id: number;
  filename?: string;
  url?: string;
  mimeType?: string;
  filesize?: number;
};

export function PodgladZalacznikow({ pole = "zalaczniki" }: { pole?: string }) {
  const surowe = useFormFields(([fields]) => fields?.[pole]?.value);
  const [pliki, setPliki] = useState<Zalacznik[]>([]);

  /* wartość pola to tablica ID albo obiektów {id} — normalizujemy */
  const ids = (Array.isArray(surowe) ? surowe : surowe != null ? [surowe] : [])
    .map((w) => (typeof w === "object" && w !== null ? (w as { id?: number }).id : w))
    .filter((x): x is number => typeof x === "number");
  const klucz = ids.join(",");

  useEffect(() => {
    if (!klucz) {
      setPliki([]);
      return;
    }
    const zapytanie = ids.map((i) => `where[id][in][]=${i}`).join("&");
    fetch(`/api/zalaczniki-zgloszen?${zapytanie}&limit=10&depth=0`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPliki(d?.docs ?? []))
      .catch(() => setPliki([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klucz]);

  if (!klucz) return null;

  return (
    <div style={{ marginBottom: "20px" }}>
      {pliki.map((p) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "8px 12px",
            marginBottom: "6px",
            border: "1px solid var(--theme-elevation-150, #e1e1e1)",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            📎 {p.filename || `załącznik ${p.id}`}
            {p.filesize ? (
              <span style={{ color: "#888" }}> · {(p.filesize / 1024 / 1024).toFixed(1)} MB</span>
            ) : null}
          </span>
          <a
            href={p.url || `/api/zalaczniki-zgloszen/file/${p.filename}`}
            target="_blank"
            rel="noreferrer"
            style={{
              flexShrink: 0,
              padding: "6px 14px",
              borderRadius: "6px",
              background: "#1d3d76",
              color: "#fff",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Zobacz załącznik ↗
          </a>
        </div>
      ))}
      {pliki.length === 0 ? (
        <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Wczytywanie załączników…</p>
      ) : null}
    </div>
  );
}
