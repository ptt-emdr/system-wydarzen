import type { CollectionConfig, Where } from "payload";
import {
  idWydarzeniaKonta,
  jestPelnymAdminem,
  katalogPlikow,
  tylkoPelnyAdmin,
} from "./wspolne";

/**
 * Załączniki zgłoszeń (np. certyfikat szkolenia Dzieci i Młodzieży).
 * Tworzone wyłącznie przez endpoint /api/zapisy (create zamknięte);
 * ODCZYT tylko po zalogowaniu — to dokumenty z danymi osobowymi.
 * Administrator jednego wydarzenia widzi wyłącznie załączniki zgłoszeń
 * swojego wydarzenia (pole „wydarzenie” wypełnia endpoint przy zapisie).
 */
export const ZalacznikiZgloszen: CollectionConfig = {
  slug: "zalaczniki-zgloszen",
  labels: {
    singular: { pl: "Załącznik zgłoszenia", en: "Registration attachment" },
    plural: { pl: "Załączniki zgłoszeń", en: "Registration attachments" },
  },
  access: {
    read: ({ req }): boolean | Where => {
      if (!req.user) return false;
      if (jestPelnymAdminem(req.user)) return true;
      return { wydarzenie: { equals: idWydarzeniaKonta(req.user) ?? 0 } };
    },
    create: tylkoPelnyAdmin,
    update: tylkoPelnyAdmin,
    delete: tylkoPelnyAdmin,
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
  fields: [
    {
      name: "wydarzenie",
      type: "relationship",
      relationTo: "wydarzenia",
      label: { pl: "Wydarzenie", en: "Event" },
      admin: {
        readOnly: true,
        description: { pl: "Wypełniane automatycznie przy zapisie z formularza.", en: "" },
      },
    },
  ],
};
