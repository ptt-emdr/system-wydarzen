import type { GlobalConfig } from "payload";
import { kazdy, tylkoAdmin } from "../collections/wspolne";

/** Ustawienia systemu wydarzeń: dane organizatora i rachunek do przelewów. */
export const Ustawienia: GlobalConfig = {
  slug: "ustawienia",
  label: { pl: "Ustawienia", en: "Settings" },
  access: { read: kazdy, update: tylkoAdmin },
  admin: { group: { pl: "Administracja", en: "Administration" } },
  fields: [
    {
      name: "organizator",
      type: "text",
      required: true,
      defaultValue: "Polskie Towarzystwo Terapii EMDR",
      label: { pl: "Nazwa organizatora", en: "Organizer" },
    },
    {
      type: "row",
      fields: [
        {
          name: "emailKontaktowy",
          type: "email",
          required: true,
          defaultValue: "sekretarz@emdr.org.pl",
          label: { pl: "E-mail kontaktowy (odpowiedzi uczestników)", en: "Contact e-mail" },
          admin: { width: "50%" },
        },
        {
          name: "telefon",
          type: "text",
          label: { pl: "Telefon (opcjonalnie)", en: "Phone" },
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "rachunek",
      type: "group",
      label: { pl: "Przelewy (instrukcja płatności)", en: "Bank transfer" },
      fields: [
        {
          name: "numer",
          type: "text",
          required: true,
          defaultValue: "00 0000 0000 0000 0000 0000 0000",
          label: { pl: "Numer rachunku", en: "Account no." },
        },
        {
          name: "odbiorca",
          type: "textarea",
          required: true,
          defaultValue: "Polskie Towarzystwo Terapii EMDR\nAl. Jana Pawła II 27, 00-867 Warszawa",
          label: { pl: "Odbiorca przelewu (nazwa i adres)", en: "Recipient" },
        },
      ],
    },
    {
      name: "klauzulaRodo",
      type: "textarea",
      required: true,
      defaultValue:
        "Administratorem danych osobowych jest Polskie Towarzystwo Terapii EMDR (Al. Jana Pawła II 27, 00-867 Warszawa). Dane podane w formularzu przetwarzane są wyłącznie w celu organizacji i rozliczenia wydarzenia oraz wystawienia dokumentów uczestnictwa i sprzedaży; przysługuje Państwu prawo dostępu do danych, ich sprostowania i usunięcia po rozliczeniu wydarzenia.",
      label: { pl: "Klauzula RODO pod formularzem", en: "GDPR clause" },
    },
  ],
};
