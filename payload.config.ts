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
  i18n: { supportedLanguages: { pl, en }, fallbackLanguage: "pl" },
  admin: {
    user: "users",
    meta: { titleSuffix: " — Wydarzenia PTT EMDR" },
    dateFormat: "dd.MM.yyyy",
  },
  collections: [Wydarzenia, Zgloszenia, ZalacznikiZgloszen, Users],
  globals: [Ustawienia],
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
