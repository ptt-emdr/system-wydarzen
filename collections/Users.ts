import type { CollectionConfig, Where } from "payload";
import {
  edytujeTylkoPelnyAdmin,
  jestPelnymAdminem,
  tylkoPelnyAdmin,
} from "./wspolne";

/**
 * Konta obsługi wydarzeń (logowanie do /admin) — osobne od CMS strony.
 * Dwie role (od 21.09.2026):
 *  - „Administrator" (pełny) — wszystko;
 *  - „Administrator jednego wydarzenia" — podgląd zgłoszeń, kart PDF,
 *    załączników i raportów TYLKO przypisanego wydarzenia; edytuje
 *    wyłącznie opis wydarzenia; bez decyzji, usuwania i płatności.
 * Kontami zarządza wyłącznie pełny Administrator; rolę i przypisane
 * wydarzenie może zmienić tylko on (konto nie podniesie sobie uprawnień).
 */
export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: { pl: "Administrator", en: "Administrator" },
    plural: { pl: "Administratorzy", en: "Administrators" },
  },
  auth: true,
  access: {
    /* każdy widzi i edytuje własne konto (zmiana hasła);
       cudze konta — tylko pełny Administrator */
    read: ({ req }): boolean | Where =>
      jestPelnymAdminem(req.user) ? true : { id: { equals: req.user?.id ?? 0 } },
    update: ({ req }): boolean | Where =>
      jestPelnymAdminem(req.user) ? true : { id: { equals: req.user?.id ?? 0 } },
    create: tylkoPelnyAdmin,
    delete: tylkoPelnyAdmin,
  },
  admin: {
    useAsTitle: "email",
    group: { pl: "Administracja", en: "Administration" },
    hidden: ({ user }) => !jestPelnymAdminem(user),
  },
  fields: [
    {
      name: "imieNazwisko",
      type: "text",
      label: { pl: "Imię i nazwisko", en: "Full name" },
    },
    {
      name: "rola",
      type: "select",
      required: true,
      defaultValue: "pelny",
      label: { pl: "Rola", en: "Role" },
      options: [
        { value: "pelny", label: { pl: "Administrator (pełne uprawnienia)", en: "Administrator" } },
        {
          value: "wydarzenie",
          label: { pl: "Administrator jednego wydarzenia", en: "Single-event administrator" },
        },
      ],
      access: edytujeTylkoPelnyAdmin,
      admin: {
        description: {
          pl: "„Administrator jednego wydarzenia” widzi wyłącznie przypisane wydarzenie i jego zgłoszenia (podgląd, karty PDF, załączniki, eksport); edytuje tylko opis wydarzenia. Decyzje, płatności i usuwanie pozostają u pełnego Administratora.",
          en: "",
        },
      },
    },
    {
      name: "wydarzenie",
      type: "relationship",
      relationTo: "wydarzenia",
      label: { pl: "Przypisane wydarzenie", en: "Assigned event" },
      access: edytujeTylkoPelnyAdmin,
      admin: {
        condition: (data) => data?.rola === "wydarzenie",
        description: { pl: "Jedyne wydarzenie widoczne dla tego konta.", en: "" },
      },
      validate: (value: unknown, { data }: { data?: { rola?: string } }) => {
        if (data?.rola === "wydarzenie" && !value) {
          return "Wybierz wydarzenie przypisane temu kontu.";
        }
        return true;
      },
    },
  ],
};
