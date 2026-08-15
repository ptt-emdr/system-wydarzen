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
