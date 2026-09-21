import path from "path";
import { fileURLToPath } from "url";
import type { Access } from "payload";

/**
 * Wspólne klocki dla kolekcji CMS: reguły dostępu i ścieżka na pliki.
 *
 * Domyślny model dostępu strony PTT EMDR:
 *  - treści publiczne czyta każdy (frontend pobiera je bez logowania),
 *  - wszelkie zmiany robi wyłącznie zalogowany administrator.
 */
export const kazdy: Access = () => true;
export const tylkoAdmin: Access = ({ req }) => Boolean(req.user);

/* ---------- role kont (od 21.09.2026) ----------
   „pelny" (domyślna, także dla kont sprzed wprowadzenia ról) = główny
   Administrator; „wydarzenie" = Administrator jednego wydarzenia:
   podgląd zgłoszeń i raportów TYLKO swojego wydarzenia, edycja
   wyłącznie opisu, bez decyzji, usuwania i zmian płatności. */
type KontoPanelu = {
  rola?: string | null;
  wydarzenie?: number | { id: number } | null;
};

export function jestPelnymAdminem(user: unknown): boolean {
  if (!user) return false;
  return ((user as KontoPanelu).rola ?? "pelny") === "pelny";
}

/** ID wydarzenia przypisanego kontu „Administrator jednego wydarzenia". */
export function idWydarzeniaKonta(user: unknown): number | null {
  const w = (user as KontoPanelu | null)?.wydarzenie;
  if (typeof w === "number") return w;
  if (w && typeof w === "object") return w.id;
  return null;
}

export const tylkoPelnyAdmin: Access = ({ req }) => jestPelnymAdminem(req.user);

/** Blokada pola dla administratora jednego wydarzenia (pole tylko do
    odczytu w panelu — „Zmiana wymagana przez Administratora"). */
export const edytujeTylkoPelnyAdmin = {
  update: ({ req }: { req: { user?: unknown } }) => jestPelnymAdminem(req.user),
};

export const dostepPubliczny = {
  read: kazdy,
  create: tylkoAdmin,
  update: tylkoAdmin,
  delete: tylkoAdmin,
};

export const dostepTylkoAdmin = {
  read: tylkoAdmin,
  create: tylkoAdmin,
  update: tylkoAdmin,
  delete: tylkoAdmin,
};

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Katalog na wgrywane pliki. Na serwerze cyber_Folks wskazywany przez
 * UPLOADS_DIR na ~/data/ptt-emdr/uploads — POZA katalogiem aplikacji,
 * żeby pliki przetrwały każde wdrożenie (rsync --delete).
 * Lokalnie: podkatalog uploads/ w projekcie.
 */
export function katalogPlikow(podkatalog: string): string {
  const baza =
    process.env.UPLOADS_DIR || path.resolve(dirname, "..", "uploads");
  return path.resolve(baza, podkatalog);
}

/** Prosty slugify dla polskich tytułów (adresy podstron aktualności). */
export function slugify(tekst: string): string {
  const mapa: Record<string, string> = {
    ą: "a", ć: "c", ę: "e", ł: "l", ń: "n",
    ó: "o", ś: "s", ź: "z", ż: "z",
  };
  return tekst
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (z) => mapa[z] ?? z)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
