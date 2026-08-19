import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { pl } from "@payloadcms/translations/languages/pl";
import { en } from "@payloadcms/translations/languages/en";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Wydarzenia } from "./collections/Wydarzenia";
import { Zgloszenia } from "./collections/Zgloszenia";
import { ZalacznikiZgloszen } from "./collections/ZalacznikiZgloszen";
import { Ustawienia } from "./globals/Ustawienia";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/* Sekret podpisuje sesje panelu — start produkcji bez niego (czyli z jawnym
   sekretem zastępczym) pozwalałby sfałszować konto administratora.
   Wyjątek: sam build (NEXT_PHASE) — pakiet buduje się lokalnie bez
   sekretów, a kontrola i tak zadziała przy starcie na serwerze. */
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  !process.env.PAYLOAD_SECRET
) {
  throw new Error(
    "Brak PAYLOAD_SECRET w środowisku produkcyjnym — odmowa startu.",
  );
}

/**
 * System zapisów na wydarzenia PTT EMDR (wydarzenia.emdr.org.pl) —
 * OSOBNA aplikacja z własnym panelem i bazą, niezależna od CMS strony
 * Towarzystwa (decyzja 15.08.2026). Wzorce identyczne jak w ptt-emdr-site:
 * SQLite przez DATABASE_URI, pliki przez UPLOADS_DIR, SMTP kei.
 */
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "tylko-dev-zmien-na-serwerze",
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || "file:./wydarzenia-dev.db",
    },
  }),
  editor: lexicalEditor(),
  sharp,
  ...(process.env.SMTP_HOST
    ? {
        email: nodemailerAdapter({
          defaultFromAddress:
            process.env.SMTP_USER || "powiadomienia@emdr.org.pl",
          defaultFromName: "Wydarzenia PTT EMDR",
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 465),
            secure: true,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          },
        }),
      }
    : {}),
  i18n: {
    supportedLanguages: { pl, en },
    fallbackLanguage: "pl",
    /* przyjaźniejsze etykiety przycisków tworzenia („Dodaj wydarzenie”) */
    translations: {
      pl: {
        general: {
          createNew: "Dodaj",
          createNewLabel: "Dodaj {{label}}",
          addNew: "Dodaj",
        },
      },
    },
  },
  admin: {
    user: "users",
    meta: { titleSuffix: " — Wydarzenia PTT EMDR" },
    dateFormat: "dd.MM.yyyy",
    components: {
      /* domyślnie jasny motyw (zmiana na ciemny: Konto → Wygląd) */
      providers: ["/components/admin/DomyslnyMotyw#DomyslnyMotyw"],
    },
  },
  collections: [Wydarzenia, Zgloszenia, ZalacznikiZgloszen, Users],
  globals: [Ustawienia],
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
