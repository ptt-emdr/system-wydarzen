import type { CollectionConfig } from "payload";
import { katalogPlikow, tylkoAdmin } from "./wspolne";

/**
 * Załączniki zgłoszeń (np. certyfikat szkolenia Dzieci i Młodzieży).
 * Tworzone wyłącznie przez endpoint /api/zapisy (create zamknięte);
 * ODCZYT tylko dla administratora — to dokumenty z danymi osobowymi.
 */
export const ZalacznikiZgloszen: CollectionConfig = {
  slug: "zalaczniki-zgloszen",
  labels: {
    singular: { pl: "Załącznik zgłoszenia", en: "Registration attachment" },
    plural: { pl: "Załączniki zgłoszeń", en: "Registration attachments" },
  },
  access: {
    create: tylkoAdmin,
    read: tylkoAdmin,
    update: tylkoAdmin,
    delete: tylkoAdmin,
  },
  admin: {
    group: { pl: "Wydarzenia", en: "Events" },
    description: {
      pl: "Dokumenty dołączone do zgłoszeń — dostępne wyłącznie po zalogowaniu.",
      en: "Admin-only.",
    },
  },
  upload: {
    staticDir: katalogPlikow("zalaczniki-zgloszen"),
    mimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  fields: [],
};
