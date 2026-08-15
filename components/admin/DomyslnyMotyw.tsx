"use client";

import { useEffect } from "react";

/**
 * Domyślny JASNY motyw panelu: gdy użytkownik nie wybrał jeszcze wyglądu
 * (brak cookie payload-theme), ustawiamy jasny. Zmiana na ciemny:
 * Konto → Wygląd — wybór użytkownika nadpisuje cookie i jest respektowany.
 */
export function DomyslnyMotyw({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      if (!document.cookie.includes("payload-theme=")) {
        document.cookie = "payload-theme=light; path=/; max-age=31536000";
        document.documentElement.setAttribute("data-theme", "light");
      }
    } catch {}
  }, []);
  return <>{children}</>;
}
