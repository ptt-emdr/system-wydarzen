import type { CollectionConfig } from "payload";
import crypto from "crypto";
import { tylkoAdmin } from "./wspolne";

/**
 * Zgłoszenia uczestników. Powstają WYŁĄCZNIE przez endpoint /api/zapisy
 * (walidacja + wyliczenie kwoty po stronie serwera) — dlatego create
 * jest tu zamknięte dla świata. Uczestnik ogląda swoje zgłoszenie przez
 * link tokenowy (strona /profil/…), bez logowania.
 *
 * Przebieg (decyzja 15.08): bez ręcznej akceptacji — zapis → e-mail
 * z instrukcją przelewu i terminem (dniNaPlatnosc) → wpłata potwierdza
 * udział; brak wpłaty w terminie = zwolnienie miejsca (F2: automat).
 */
export const Zgloszenia: CollectionConfig = {
  slug: "zgloszenia",
  labels: {
    singular: { pl: "Zgłoszenie", en: "Registration" },
    plural: { pl: "Zgłoszenia", en: "Registrations" },
  },
  access: {
    read: tylkoAdmin,
    create: tylkoAdmin,
    update: tylkoAdmin,
    delete: tylkoAdmin,
  },
  admin: {
    useAsTitle: "opisowy",
    defaultColumns: ["opisowy", "wydarzenie", "status", "kwotaNalezna", "terminPlatnosci"],
    group: { pl: "Wydarzenia", en: "Events" },
    description: {
      pl: "Wpłatę dopisuje się na karcie zgłoszenia (sekcja Wpłaty) — status „Potwierdzone” ustawia się wtedy sam.",
      en: "",
    },
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (!data) return data;
        if (operation === "create") {
          data.token = crypto.randomBytes(16).toString("hex");
        }
        /* status nadąża za wpłatami: suma wpłat >= należność → Potwierdzone */
        const wplacono = (data.wplaty || []).reduce(
          (s: number, w: { kwota?: number }) => s + (w.kwota || 0),
          0,
        );
        data.wplacono = wplacono;
        if (data.status !== "anulowane" && data.status !== "obecny") {
          data.status =
            wplacono >= (data.kwotaNalezna || 0) ? "potwierdzone" : "oczekuje";
        }
        return data;
      },
    ],
    beforeValidate: [
      ({ data }) => {
        if (data) {
          data.opisowy = `${data.nazwisko || ""} ${data.imie || ""}`.trim();
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "opisowy", type: "text", admin: { hidden: true } },
    {
      type: "row",
      fields: [
        { name: "imie", type: "text", required: true, label: { pl: "Imię", en: "First name" }, admin: { width: "33%" } },
        { name: "nazwisko", type: "text", required: true, label: { pl: "Nazwisko", en: "Last name" }, admin: { width: "33%" } },
        { name: "email", type: "email", required: true, label: { pl: "E-mail", en: "E-mail" }, admin: { width: "33%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "telefon", type: "text", label: { pl: "Telefon", en: "Phone" }, admin: { width: "33%" } },
        {
          name: "wydarzenie",
          type: "relationship",
          relationTo: "wydarzenia",
          required: true,
          label: { pl: "Wydarzenie", en: "Event" },
          admin: { width: "66%" },
        },
      ],
    },
    {
      name: "wybraneTerminy",
      type: "array",
      label: { pl: "Wybrane terminy (cykl)", en: "Selected sessions" },
      labels: { singular: { pl: "Termin", en: "Session" }, plural: { pl: "Terminy", en: "Sessions" } },
      fields: [{ name: "nazwa", type: "text", required: true, label: { pl: "Termin", en: "Session" } }],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "oczekuje",
      label: { pl: "Status", en: "Status" },
      options: [
        { value: "oczekuje", label: { pl: "Oczekuje na wpłatę", en: "Awaiting payment" } },
        { value: "potwierdzone", label: { pl: "Potwierdzone (opłacone)", en: "Confirmed" } },
        { value: "obecny", label: { pl: "Obecny (po wydarzeniu)", en: "Attended" } },
        { value: "anulowane", label: { pl: "Anulowane", en: "Cancelled" } },
      ],
      admin: { position: "sidebar" },
    },
    {
      type: "row",
      fields: [
        {
          name: "kwotaNalezna",
          type: "number",
          required: true,
          min: 0,
          label: { pl: "Do zapłaty (zł)", en: "Due" },
          admin: { width: "33%" },
        },
        {
          name: "wplacono",
          type: "number",
          label: { pl: "Wpłacono (zł) — liczy się samo", en: "Paid" },
          admin: { width: "33%", readOnly: true },
        },
        {
          name: "terminPlatnosci",
          type: "date",
          label: { pl: "Termin płatności", en: "Payment deadline" },
          admin: { width: "33%", date: { displayFormat: "dd.MM.yyyy" } },
        },
      ],
    },
    {
      name: "wplaty",
      type: "array",
      label: { pl: "Wpłaty i zwroty", en: "Payments" },
      labels: { singular: { pl: "Operacja", en: "Entry" }, plural: { pl: "Operacje", en: "Entries" } },
      admin: { description: { pl: "Zwrot = kwota ujemna. Suma steruje statusem.", en: "" } },
      fields: [
        {
          type: "row",
          fields: [
            { name: "dzien", type: "date", required: true, label: { pl: "Data", en: "Date" }, admin: { width: "33%", date: { displayFormat: "dd.MM.yyyy" } } },
            { name: "kwota", type: "number", required: true, label: { pl: "Kwota (zł)", en: "Amount" }, admin: { width: "33%" } },
            { name: "uwagi", type: "text", label: { pl: "Uwagi", en: "Notes" }, admin: { width: "33%" } },
          ],
        },
      ],
    },
    {
      name: "kodPlatnosci",
      type: "text",
      label: { pl: "Kod do tytułu przelewu", en: "Transfer code" },
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "odpowiedzi",
      type: "array",
      label: { pl: "Odpowiedzi z formularza", en: "Form answers" },
      labels: { singular: { pl: "Odpowiedź", en: "Answer" }, plural: { pl: "Odpowiedzi", en: "Answers" } },
      admin: { readOnly: true },
      fields: [
        {
          type: "row",
          fields: [
            { name: "pytanie", type: "text", label: { pl: "Pole", en: "Field" }, admin: { width: "50%" } },
            { name: "odpowiedz", type: "text", label: { pl: "Odpowiedź", en: "Answer" }, admin: { width: "50%" } },
          ],
        },
      ],
    },
    {
      name: "zalaczniki",
      type: "relationship",
      relationTo: "zalaczniki-zgloszen",
      hasMany: true,
      label: { pl: "Załączniki (np. certyfikat)", en: "Attachments" },
    },
    {
      name: "chceFakture",
      type: "checkbox",
      defaultValue: false,
      label: { pl: "Prosi o fakturę", en: "Wants invoice" },
      admin: { position: "sidebar" },
    },
    {
      name: "faktura",
      type: "group",
      label: { pl: "Dane do faktury", en: "Invoice data" },
      admin: { condition: (data) => Boolean(data?.chceFakture) },
      fields: [
        {
          type: "row",
          fields: [
            { name: "nazwa", type: "text", label: { pl: "Nazwa firmy / imię i nazwisko", en: "Name" }, admin: { width: "60%" } },
            { name: "nip", type: "text", label: { pl: "NIP (dla firm)", en: "Tax ID" }, admin: { width: "40%" } },
          ],
        },
        { name: "adres", type: "text", label: { pl: "Adres (ulica, kod, miejscowość)", en: "Address" } },
      ],
    },
    {
      name: "notatka",
      type: "textarea",
      label: { pl: "Notatka organizatora", en: "Note" },
    },
    { name: "zgodaRodo", type: "checkbox", label: { pl: "Zgoda RODO zaznaczona", en: "GDPR consent" }, admin: { position: "sidebar", readOnly: true } },
    { name: "token", type: "text", admin: { hidden: true } },
  ],
};
