import path from "path";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

/**
 * Karta zgłoszenia jako dokument PDF (pobieranie pliku bez okna
 * drukowania). Tabele płyną naturalnie przez kolejne strony A4 —
 * łamanie wyłącznie między wierszami (wrap={false} na wierszu).
 * Czcionka DejaVu Sans — komplet polskich znaków.
 */

const CZCIONKI = path.join(process.cwd(), "node_modules/dejavu-fonts-ttf/ttf");
Font.register({
  family: "DejaVu",
  fonts: [
    { src: path.join(CZCIONKI, "DejaVuSans.ttf") },
    { src: path.join(CZCIONKI, "DejaVuSans-Bold.ttf"), fontWeight: 700 },
  ],
});
/* bez dzielenia wyrazów — polskie słowa łamane sylabicznie wyglądają źle */
Font.registerHyphenationCallback((slowo) => [slowo]);

const s = StyleSheet.create({
  strona: {
    fontFamily: "DejaVu",
    fontSize: 8.5,
    color: "#1a1a1a",
    paddingTop: 34,
    paddingBottom: 44,
    paddingHorizontal: 40,
    lineHeight: 1.4,
  },
  naglowek: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#f5c518",
    paddingBottom: 8,
    marginBottom: 4,
  },
  tytul: { fontSize: 14, fontWeight: 700 },
  podtytul: { fontSize: 8, color: "#555555", marginTop: 2 },
  sekcja: { fontSize: 10.5, fontWeight: 700, marginTop: 12, marginBottom: 4 },
  wiersz: { flexDirection: "row" },
  etykieta: {
    width: "34%",
    fontWeight: 700,
    backgroundColor: "#f7f4ea",
    borderWidth: 0.75,
    borderColor: "#d8d8d8",
    padding: 5,
  },
  wartosc: {
    flex: 1,
    borderWidth: 0.75,
    borderColor: "#d8d8d8",
    borderLeftWidth: 0,
    padding: 5,
  },
  stopka: {
    marginTop: 14,
    paddingTop: 6,
    borderTopWidth: 0.75,
    borderTopColor: "#dddddd",
    fontSize: 7,
    color: "#777777",
  },
  numerStrony: {
    position: "absolute",
    bottom: 20,
    right: 40,
    fontSize: 7,
    color: "#999999",
  },
});

export type DaneKarty = {
  idZgloszenia: string;
  dataZgloszenia: string;
  wygenerowano: string;
  logo: Buffer | null;
  wydarzenie: { l: string; w: string }[];
  uczestnik: { l: string; w: string }[];
  platnosci: { l: string; w: string }[];
  faktura: { l: string; w: string }[] | null;
  odpowiedzi: { pytanie: string; odpowiedz: string }[];
  zalaczniki: string;
};

function Tabela({ pozycje }: { pozycje: { l: string; w: string }[] }) {
  return (
    <View>
      {pozycje.map((p, i) => (
        <View key={i} style={[s.wiersz, i > 0 ? { marginTop: -0.75 } : {}]} wrap={false}>
          <Text style={s.etykieta}>{p.l}</Text>
          <Text style={s.wartosc}>{p.w || "—"}</Text>
        </View>
      ))}
    </View>
  );
}

export function KartaPdf({ dane }: { dane: DaneKarty }) {
  const nrOdpowiedzi = dane.faktura ? 5 : 4;
  return (
    <Document
      title={`Karta zgłoszenia nr ${dane.idZgloszenia} — PTT EMDR`}
      author="Polskie Towarzystwo Terapii EMDR"
    >
      <Page size="A4" style={s.strona}>
        <View style={s.naglowek}>
          {dane.logo ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={{ data: dane.logo, format: "png" }} style={{ height: 40, width: 97 }} />
          ) : null}
          <View>
            <Text style={s.tytul}>Karta zgłoszenia na wydarzenie</Text>
            <Text style={s.podtytul}>
              Polskie Towarzystwo Terapii EMDR · data zgłoszenia: {dane.dataZgloszenia}
            </Text>
          </View>
        </View>

        <Text style={s.sekcja}>1. Wydarzenie</Text>
        <Tabela pozycje={dane.wydarzenie} />

        <Text style={s.sekcja}>2. Dane uczestnika</Text>
        <Tabela pozycje={dane.uczestnik} />

        <Text style={s.sekcja}>3. Status i płatności</Text>
        <Tabela pozycje={dane.platnosci} />

        {dane.faktura ? (
          <>
            <Text style={s.sekcja}>4. Dane do faktury</Text>
            <Tabela pozycje={dane.faktura} />
          </>
        ) : null}

        <Text style={s.sekcja}>{nrOdpowiedzi}. Odpowiedzi z formularza zgłoszeniowego</Text>
        {dane.odpowiedzi.length ? (
          <View>
            <View style={s.wiersz} wrap={false}>
              <Text style={[s.etykieta, { width: "45%" }]}>Pole formularza</Text>
              <Text style={[s.wartosc, { backgroundColor: "#f7f4ea", fontWeight: 700 }]}>
                Odpowiedź
              </Text>
            </View>
            {dane.odpowiedzi.map((o, i) => (
              <View key={i} style={[s.wiersz, { marginTop: -0.75 }]} wrap={false}>
                <Text style={[s.etykieta, { width: "45%", backgroundColor: "#fdfcf7" }]}>
                  {o.pytanie}
                </Text>
                <Text style={s.wartosc}>{o.odpowiedz || "—"}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: "#555555" }}>Formularz nie zawierał dodatkowych pytań.</Text>
        )}

        <View wrap={false}>
          <Text style={s.sekcja}>{nrOdpowiedzi + 1}. Załączniki i decyzja</Text>
          <View style={s.wiersz}>
            <Text style={s.etykieta}>Załączone pliki</Text>
            <Text style={s.wartosc}>{dane.zalaczniki}</Text>
          </View>
          <View style={[s.wiersz, { marginTop: -0.75 }]}>
            <Text style={s.etykieta}>Decyzja organizatora / podpis</Text>
            <Text style={[s.wartosc, { minHeight: 50 }]}> </Text>
          </View>
        </View>

        <View style={s.stopka} wrap={false}>
          <Text>
            Dokument wygenerowany z systemu zapisów na wydarzenia Polskiego
            Towarzystwa Terapii EMDR (wydarzenia.emdr.org.pl) · wygenerowano:{" "}
            {dane.wygenerowano} · zgłoszenie nr {dane.idZgloszenia} · zawiera
            dane osobowe — przechowywać zgodnie z zasadami RODO.
          </Text>
        </View>

        <Text
          style={s.numerStrony}
          fixed
          render={({ pageNumber, totalPages }) => `Strona ${pageNumber} z ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
