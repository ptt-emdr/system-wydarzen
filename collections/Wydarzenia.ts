import type { CollectionConfig } from "payload";
import { kazdy, tylkoAdmin, slugify } from "./wspolne";

/**
 * Wydarzenia PTT EMDR (szkolenia, superwizje, cykle, konferencje).
 * Publicznie widoczne są wyłącznie wydarzenia „Opublikowane" —
 * strona wydarzenia + formularz zapisów działają na wydarzenia.emdr.org.pl.
 *
 * Model cen: domyślnie JEDNA kwota (pole „Cena"); progi czasowe
 * (wczesna/późna rejestracja) to opcja per wydarzenie. Cykl = terminy
 * w tabeli „Terminy" (każdy z własnym limitem i oknem zapisów).
 */
export const Wydarzenia: CollectionConfig = {
  slug: "wydarzenia",
  labels: {
    singular: { pl: "Wydarzenie", en: "Event" },
    plural: { pl: "Wydarzenia", en: "Events" },
  },
  access: {
    read: ({ req }) => (req.user ? true : { opublikowane: { equals: true } }),
    create: tylkoAdmin,
    update: tylkoAdmin,
    delete: tylkoAdmin,
  },
  admin: {
    useAsTitle: "tytul",
    defaultColumns: ["tytul", "dataOd", "liczbaZapisanych", "opublikowane"],
    group: { pl: "Wydarzenia", en: "Events" },
    description: {
      pl: "Wydarzenie pojawia się na stronie zapisów dopiero po zaznaczeniu „Opublikowane”.",
      en: "Visible publicly only when published.",
    },
    components: {
      beforeListTable: ["/components/admin/LinkPanelu#LinkPanelu"],
    },
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data && !data.slug && data.tytul) data.slug = slugify(data.tytul);
        return data;
      },
    ],
  },
  fields: [
    {
      name: "tytul",
      type: "text",
      required: true,
      label: { pl: "Nazwa wydarzenia", en: "Title" },
    },
    {
      name: "typ",
      type: "select",
      required: true,
      defaultValue: "szkolenie",
      label: { pl: "Typ wydarzenia", en: "Event type" },
      options: [
        { value: "konferencja", label: { pl: "Konferencja", en: "Conference" } },
        { value: "szkolenie", label: { pl: "Szkolenie", en: "Training" } },
        { value: "superwizja", label: { pl: "Superwizja", en: "Supervision" } },
        { value: "cykl", label: { pl: "Cykl (szkoleń/superwizji)", en: "Series" } },
        { value: "webinar", label: { pl: "Webinar", en: "Webinar" } },
        { value: "spotkanie", label: { pl: "Spotkanie", en: "Meeting" } },
        { value: "inne", label: { pl: "Inne", en: "Other" } },
      ],
      admin: {
        position: "sidebar",
        description: { pl: "Do statystyk i raportów zbiorczych.", en: "" },
      },
    },
    {
      name: "slug",
      type: "text",
      unique: true,
      label: { pl: "Adres (slug)", en: "Slug" },
      admin: {
        position: "sidebar",
        description: {
          pl: "Część adresu strony wydarzenia, np. „cykl-dim-2026”. Puste = utworzy się z nazwy.",
          en: "URL part; auto-generated when empty.",
        },
      },
    },
    {
      name: "opublikowane",
      type: "checkbox",
      defaultValue: false,
      label: { pl: "Opublikowane (widoczne i otwarte na zapisy)", en: "Published" },
      admin: { position: "sidebar" },
    },
    {
      /* pole wirtualne: nie jest zapisywane w bazie — liczy się przy
         każdym odczycie z nieanulowanych zgłoszeń (kolumna na liście) */
      name: "liczbaZapisanych",
      type: "text",
      virtual: true,
      label: { pl: "Zapisani", en: "Registered" },
      admin: {
        position: "sidebar",
        readOnly: true,
        description: {
          pl: "Aktualna liczba zapisanych (bez anulowanych); przy włączonym limicie: „zapisani / limit”.",
          en: "",
        },
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data?.id) return "0";
            const wynik = await req.payload.count({
              collection: "zgloszenia",
              where: {
                and: [
                  { wydarzenie: { equals: data.id } },
                  { status: { not_in: ["anulowane", "rezerwowa", "odrzucone"] } },
                ],
              },
            });
            return data.limitMiejsc
              ? `${wynik.totalDocs} / ${data.limitMiejsc}`
              : String(wynik.totalDocs);
          },
        ],
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "dataOd",
          type: "date",
          required: true,
          label: { pl: "Rozpoczęcie", en: "Start" },
          admin: { width: "33%", date: { pickerAppearance: "dayAndTime", displayFormat: "dd.MM.yyyy HH:mm" } },
        },
        {
          name: "dataDo",
          type: "date",
          label: { pl: "Zakończenie", en: "End" },
          admin: { width: "33%", date: { pickerAppearance: "dayAndTime", displayFormat: "dd.MM.yyyy HH:mm" } },
        },
        {
          name: "miejsce",
          type: "text",
          label: { pl: "Miejsce (lub „online”)", en: "Venue" },
          admin: { width: "33%" },
        },
      ],
    },
    {
      name: "opis",
      type: "textarea",
      required: true,
      label: { pl: "Opis wydarzenia", en: "Description" },
      admin: { description: { pl: "Kilka akapitów na stronie wydarzenia (pusta linia = nowy akapit).", en: "" } },
    },
    /* ---------- pieniądze ---------- */
    {
      type: "row",
      fields: [
        {
          name: "cena",
          type: "number",
          required: true,
          min: 0,
          label: { pl: "Cena (zł, brutto)", en: "Price" },
          admin: {
            width: "33%",
            description: { pl: "0 = wydarzenie bezpłatne.", en: "0 = free." },
          },
        },
        {
          name: "dniNaPlatnosc",
          type: "number",
          required: true,
          defaultValue: 3,
          min: 1,
          label: { pl: "Dni na płatność", en: "Days to pay" },
          admin: {
            width: "33%",
            description: {
              pl: "Po zapisie uczestnik ma tyle dni na przelew; potem miejsce wraca do puli.",
              en: "",
            },
          },
        },
        {
          name: "limitMiejsc",
          type: "number",
          min: 1,
          label: { pl: "Limit miejsc (całe wydarzenie)", en: "Seat limit" },
          admin: {
            width: "33%",
            description: { pl: "Puste = bez limitu. Cykl: limity ustawia się przy terminach.", en: "" },
          },
        },
      ],
    },
    {
      name: "akceptacjaUczestnikow",
      type: "checkbox",
      defaultValue: false,
      label: { pl: "Akceptowanie uczestników (weryfikacja przed płatnością)", en: "Approval required" },
      admin: {
        position: "sidebar",
        description: {
          pl: "Włączone: nowe zgłoszenie trafia do weryfikacji (np. sprawdzenie załączonego dokumentu). Na karcie zgłoszenia pojawiają się przyciski „Akceptuj” / „Odrzuć”; dopiero akceptacja wysyła uczestnikowi dane do przelewu (termin liczony od akceptacji).",
          en: "",
        },
      },
    },
    {
      name: "listaRezerwowa",
      type: "checkbox",
      defaultValue: false,
      label: { pl: "Po wyczerpaniu limitu przyjmuj na listę rezerwową", en: "Waitlist" },
      admin: {
        position: "sidebar",
        description: {
          pl: "Włączone: zamiast blokady zapisów formularz przyjmuje zgłoszenia na listę rezerwową (bez instrukcji płatności). Przesunięcie na listę główną: na karcie zgłoszenia zmień status na „Oczekuje na wpłatę” — uczestnik dostanie wtedy e-mail z płatnością i terminem.",
          en: "",
        },
      },
    },
    {
      name: "progiCenowe",
      type: "array",
      label: { pl: "Progi cenowe (opcja: wczesna/późna rejestracja)", en: "Price tiers" },
      labels: { singular: { pl: "Próg", en: "Tier" }, plural: { pl: "Progi", en: "Tiers" } },
      admin: {
        description: {
          pl: "Zwykle puste — obowiązuje jedna „Cena”. Dodaj progi, aby cena zależała od daty zapisu; obowiązuje pierwszy próg, którego data „do kiedy” jeszcze nie minęła, a po wszystkich progach — „Cena”.",
          en: "Optional time-based prices.",
        },
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "nazwa", type: "text", required: true, label: { pl: "Nazwa (np. Wczesna rejestracja)", en: "Name" }, admin: { width: "40%" } },
            { name: "cenaProgu", type: "number", required: true, min: 0, label: { pl: "Cena (zł)", en: "Price" }, admin: { width: "25%" } },
            {
              name: "doKiedy",
              type: "date",
              required: true,
              label: { pl: "Obowiązuje do", en: "Until" },
              admin: { width: "35%", date: { pickerAppearance: "dayAndTime", displayFormat: "dd.MM.yyyy HH:mm" } },
            },
          ],
        },
      ],
    },
    /* ---------- terminy (cykl) ---------- */
    {
      name: "trybZapisu",
      type: "select",
      defaultValue: "wydarzenie",
      required: true,
      label: { pl: "Na co zapisuje się uczestnik", en: "Registration mode" },
      options: [
        { value: "wydarzenie", label: { pl: "Całe wydarzenie (jeden zapis)", en: "Whole event" } },
        { value: "terminy", label: { pl: "Wybrane terminy z listy (cykl)", en: "Individual sessions" } },
      ],
      admin: {
        description: {
          pl: "„Wybrane terminy”: uczestnik zaznacza terminy, płaci cenę × liczba terminów (chyba że termin ma własną cenę).",
          en: "",
        },
      },
    },
    {
      name: "terminy",
      type: "array",
      label: { pl: "Terminy (dla cyklu)", en: "Sessions" },
      labels: { singular: { pl: "Termin", en: "Session" }, plural: { pl: "Terminy", en: "Sessions" } },
      admin: {
        condition: (data) => data?.trybZapisu === "terminy",
        description: { pl: "Każdy termin ma własny limit miejsc; okno zapisów jest opcjonalne.", en: "" },
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "nazwa", type: "text", required: true, label: { pl: "Nazwa (np. „Superwizja I — 10.10, online”)", en: "Name" }, admin: { width: "50%" } },
            {
              name: "data",
              type: "date",
              required: true,
              label: { pl: "Data i godzina", en: "Date" },
              admin: { width: "50%", date: { pickerAppearance: "dayAndTime", displayFormat: "dd.MM.yyyy HH:mm" } },
            },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "limit", type: "number", min: 1, label: { pl: "Limit miejsc", en: "Limit" }, admin: { width: "33%", description: { pl: "Puste = bez limitu.", en: "" } } },
            { name: "cenaTerminu", type: "number", min: 0, label: { pl: "Cena terminu (zł)", en: "Price" }, admin: { width: "33%", description: { pl: "Puste = cena wydarzenia.", en: "" } } },
            {
              name: "zapisyDo",
              type: "date",
              label: { pl: "Zapisy do", en: "Close" },
              admin: { width: "33%", date: { pickerAppearance: "dayAndTime", displayFormat: "dd.MM.yyyy HH:mm" } },
            },
          ],
        },
      ],
    },
    /* ---------- kreator formularza ---------- */
    {
      name: "pola",
      type: "array",
      label: { pl: "Dodatkowe pola formularza", en: "Custom form fields" },
      labels: { singular: { pl: "Pole", en: "Field" }, plural: { pl: "Pola", en: "Fields" } },
      admin: {
        description: {
          pl: "Formularz zawsze zbiera: imię, nazwisko, e-mail, telefon oraz (opcjonalnie) dane do faktury i zgodę RODO. Tutaj dodaje się resztę — w tym wymagane załączniki (np. certyfikat).",
          en: "",
        },
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "etykieta", type: "text", required: true, label: { pl: "Etykieta pola", en: "Label" }, admin: { width: "50%" } },
            {
              name: "typ",
              type: "select",
              required: true,
              defaultValue: "tekst",
              label: { pl: "Typ", en: "Type" },
              options: [
                { value: "tekst", label: { pl: "Tekst (jedna linia)", en: "Text" } },
                { value: "tekstDlugi", label: { pl: "Tekst (wiele linii)", en: "Textarea" } },
                { value: "lista", label: { pl: "Lista rozwijana", en: "Select" } },
                { value: "opcje", label: { pl: "Jeden z wielu (kółka)", en: "Radio" } },
                { value: "checkbox", label: { pl: "Pole wyboru (tak/nie)", en: "Checkbox" } },
                { value: "zalacznik", label: { pl: "Załącznik (PDF/JPG/PNG)", en: "File" } },
                { value: "info", label: { pl: "Blok informacyjny (bez odpowiedzi)", en: "Info" } },
              ],
              admin: { width: "30%" },
            },
            { name: "wymagane", type: "checkbox", defaultValue: false, label: { pl: "Wymagane", en: "Required" }, admin: { width: "20%" } },
          ],
        },
        {
          name: "opcje",
          type: "textarea",
          label: { pl: "Opcje / treść informacji", en: "Options" },
          admin: {
            description: { pl: "Dla listy i „jeden z wielu”: jedna opcja na linię. Dla bloku informacyjnego: treść.", en: "" },
            condition: (_data, wiersz) => ["lista", "opcje", "info"].includes(wiersz?.typ),
          },
        },
      ],
    },
    {
      name: "zbierajDaneFaktury",
      type: "checkbox",
      defaultValue: true,
      label: { pl: "Pokaż moduł „Proszę o wystawienie faktury”", en: "Invoice module" },
      admin: { position: "sidebar" },
    },
    {
      name: "instrukcjaPlatnosci",
      type: "textarea",
      label: { pl: "Dopisek do instrukcji płatności (opcjonalny)", en: "Payment note" },
      admin: {
        description: { pl: "Rachunek i odbiorca przelewu są w Ustawieniach; tu można dodać zdanie specyficzne dla wydarzenia.", en: "" },
      },
    },
  ],
};
