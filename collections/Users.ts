import type { CollectionConfig } from "payload";
import { dostepTylkoAdmin } from "./wspolne";

/** Konta obsługi wydarzeń (logowanie do /admin) — osobne od CMS strony. */
export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: { pl: "Administrator", en: "Administrator" },
    plural: { pl: "Administratorzy", en: "Administrators" },
  },
  auth: true,
  access: dostepTylkoAdmin,
  admin: {
    useAsTitle: "email",
    group: { pl: "Administracja", en: "Administration" },
  },
  fields: [
    {
      name: "imieNazwisko",
      type: "text",
      label: { pl: "Imię i nazwisko", en: "Full name" },
    },
  ],
};
