"use client";

import { useAuth } from "@payloadcms/ui";

/**
 * Żółty pasek informacyjny dla konta „Administrator jednego wydarzenia" —
 * wyjaśnia zakres uprawnień na karcie wydarzenia i karcie zgłoszenia.
 * Pełny Administrator go nie widzi. Tekst parametryzowany z clientProps.
 */
export function KomunikatRoli({ tekst }: { tekst?: string }) {
  const { user } = useAuth<{ rola?: string }>();
  if (!user || (user.rola ?? "pelny") !== "wydarzenie") return null;
  return (
    <div
      style={{
        marginBottom: "20px",
        padding: "12px 16px",
        borderRadius: "8px",
        border: "2px solid #fbbb15",
        background: "var(--theme-elevation-50, #fffbe8)",
        fontSize: "13px",
        lineHeight: 1.5,
      }}
    >
      <b>Konto z uprawnieniami do jednego wydarzenia.</b>{" "}
      {tekst ||
        "Pola tylko do odczytu: Zmiana wymagana przez Administratora."}
    </div>
  );
}
