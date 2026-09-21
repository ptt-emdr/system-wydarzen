import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { DrukujKarte } from "./DrukujKarte";

export const dynamic = "force-dynamic";

/**
 * Karta zgłoszenia na wydarzenie do wydruku / zapisu PDF (segregator).
 * Dostęp wyłącznie po zalogowaniu do panelu; otwierana przyciskiem
 * z karty zgłoszenia w CMS. PDF przez systemowe okno drukowania.
 * Logo ładowane z głównej strony — ta aplikacja nie ma katalogu public/.
 */

const STATUSY: Record<string, string> = {
  doAkceptacji: "Do akceptacji (weryfikacja)",
  oczekuje: "Oczekuje na wpłatę",
  potwierdzone: "Potwierdzone (opłacone)",
  rezerwowa: "Lista rezerwowa",
  obecny: "Obecny (po wydarzeniu)",
  nieobecny: "Nieobecny (po wydarzeniu)",
  odrzucone: "Odrzucone (weryfikacja)",
  anulowane: "Anulowane",
};

function dataPL(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function zl(kwota?: number | null): string {
  return `${(kwota || 0).toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł`;
}

export default async function KartaZgloszenia({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  if (!user) {
    return (
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", textAlign: "center" }}>
        <p>
          Karta zgłoszenia wymaga zalogowania do panelu —{" "}
          <a href="/admin" style={{ fontWeight: 700 }}>przejdź do logowania</a>{" "}
          i otwórz kartę ponownie.
        </p>
      </main>
    );
  }

  let z: Record<string, unknown> & {
    imie?: string; nazwisko?: string; email?: string; telefon?: string;
    status?: string; kwotaNalezna?: number; wplacono?: number;
    terminPlatnosci?: string; kodPlatnosci?: string; createdAt?: string;
    powodOdrzucenia?: string; powodAnulowania?: string;
    zgodaRodo?: boolean; chceFakture?: boolean;
    faktura?: { nazwa?: string; nip?: string; adres?: string } | null;
    wydarzenie?: { tytul?: string; dataOd?: string; dataDo?: string; miejsce?: string } | number;
    wybraneTerminy?: { nazwa?: string }[] | null;
    wplaty?: { dzien?: string; kwota?: number; uwagi?: string }[] | null;
    odpowiedzi?: { pytanie?: string; odpowiedz?: string }[] | null;
    zalaczniki?: ({ filename?: string } | number)[] | null;
  };
  try {
    /* reguły dostępu: administrator jednego wydarzenia otworzy kartę
       wyłącznie zgłoszenia ze swojego wydarzenia */
    z = (await payload.findByID({
      collection: "zgloszenia",
      id,
      depth: 1,
      overrideAccess: false,
      user,
    })) as unknown as typeof z;
  } catch {
    notFound();
  }

  const w = typeof z.wydarzenie === "object" && z.wydarzenie !== null ? z.wydarzenie : null;
  const terminWydarzenia = [dataPL(w?.dataOd), w?.dataDo ? dataPL(w.dataDo) : null]
    .filter((t) => t && t !== "—")
    .join(" – ");
  const terminy = (z.wybraneTerminy || []).map((t) => t.nazwa).filter(Boolean) as string[];
  const wplaty = (z.wplaty || []).filter((wp) => wp.kwota != null);
  const odpowiedzi = (z.odpowiedzi || []).filter((o) => o.pytanie);
  const zalaczniki = (Array.isArray(z.zalaczniki) ? z.zalaczniki : [])
    .map((p) => (typeof p === "object" && p !== null ? (p as { filename?: string }).filename : null))
    .filter(Boolean) as string[];

  const et = { border: "1px solid #d8d8d8", padding: "7px 10px", verticalAlign: "top" as const };
  const etL = { ...et, width: "34%", fontWeight: 700, background: "#f7f4ea" };
  const naglowek = { fontSize: "14px", margin: "16px 0 6px" };

  const Wiersz = ({ l, w: wartosc }: { l: string; w?: string | null }) => (
    <tr>
      <td style={etL}>{l}</td>
      <td style={et}>{wartosc || "—"}</td>
    </tr>
  );

  return (
    <main
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "12.5px",
        color: "#1a1a1a",
        maxWidth: "210mm",
        margin: "0 auto",
        background: "#fff",
        padding: "14mm 16mm",
        lineHeight: 1.45,
      }}
    >
      <style>{`
        /* ---- podział na strony A4 ----
           - krótkie sekcje (.sekcja) nigdy nie łamią się w środku:
             jeżeli nie mieszczą się na stronie, przechodzą w całości,
           - długa tabela odpowiedzi łamie się MIĘDZY wierszami,
             a jej nagłówek powtarza się na każdej stronie,
           - przy rozbudowanych formularzach (.nowa-strona) odpowiedzi
             zaczynają się od świeżej strony */
        @media print {
          body { background: #fff !important; }
          .bez-druku { display: none !important; }
          main { padding: 0 !important; max-width: 100% !important; }
          header { break-after: avoid; }
          h2 { break-after: avoid; break-inside: avoid; }
          .sekcja { break-inside: avoid; }
          .nowa-strona { break-before: page; }
          tr { break-inside: avoid; }
          thead { display: table-header-group; }
          footer { break-inside: avoid; }
        }
        @page { size: A4; margin: 12mm; }
        table { border-collapse: collapse; width: 100%; }
        td, th { word-break: break-word; }
      `}</style>

      <div className="bez-druku" style={{ textAlign: "right", marginBottom: "12px" }}>
        <DrukujKarte />
      </div>

      <header style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "3px solid #f5c518", paddingBottom: "12px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://emdr.org.pl/logo-pttemdr.png" alt="Polskie Towarzystwo Terapii EMDR" style={{ height: "56px", width: "auto" }} />
        <div>
          <h1 style={{ margin: 0, fontSize: "19px" }}>Karta zgłoszenia na wydarzenie</h1>
          <p style={{ margin: "3px 0 0", color: "#555" }}>
            Polskie Towarzystwo Terapii EMDR · data zgłoszenia: <b>{dataPL(z.createdAt)}</b>
          </p>
        </div>
      </header>

      <section className="sekcja">
        <h2 style={naglowek}>1. Wydarzenie</h2>
        <table>
          <tbody>
            <Wiersz l="Nazwa wydarzenia" w={w?.tytul} />
            <Wiersz l="Termin" w={terminWydarzenia || null} />
            <Wiersz l="Miejsce" w={w?.miejsce} />
            {terminy.length ? <Wiersz l="Wybrane terminy (cykl)" w={terminy.join("; ")} /> : null}
          </tbody>
        </table>
      </section>

      <section className="sekcja">
        <h2 style={naglowek}>2. Dane uczestnika</h2>
        <table>
          <tbody>
            <Wiersz l="Imię i nazwisko" w={`${z.imie || ""} ${z.nazwisko || ""}`.trim()} />
            <Wiersz l="Adres e-mail" w={z.email} />
            <Wiersz l="Telefon" w={z.telefon} />
            <Wiersz l="Zgoda RODO" w={z.zgodaRodo ? "☑ TAK" : "☐ nie"} />
          </tbody>
        </table>
      </section>

      <section className="sekcja">
      <h2 style={naglowek}>3. Status i płatności</h2>
      <table>
        <tbody>
          <Wiersz l="Status zgłoszenia" w={STATUSY[z.status || ""] || z.status} />
          {z.powodOdrzucenia ? <Wiersz l="Powód odrzucenia" w={z.powodOdrzucenia} /> : null}
          <Wiersz l="Do zapłaty" w={zl(z.kwotaNalezna)} />
          <Wiersz l="Wpłacono" w={zl(z.wplacono)} />
          {z.terminPlatnosci ? <Wiersz l="Termin płatności" w={dataPL(z.terminPlatnosci)} /> : null}
          {z.kodPlatnosci ? <Wiersz l="Kod do tytułu przelewu" w={z.kodPlatnosci} /> : null}
          {wplaty.length ? (
            <Wiersz
              l="Wpłaty i zwroty"
              w={wplaty
                .map((wp) => `${dataPL(wp.dzien)}: ${zl(wp.kwota)}${wp.uwagi ? ` (${wp.uwagi})` : ""}`)
                .join("; ")}
            />
          ) : null}
        </tbody>
      </table>
      </section>

      {z.chceFakture ? (
        <section className="sekcja">
          <h2 style={naglowek}>4. Dane do faktury</h2>
          <table>
            <tbody>
              <Wiersz l="Nazwa firmy / imię i nazwisko" w={z.faktura?.nazwa} />
              <Wiersz l="NIP" w={z.faktura?.nip} />
              <Wiersz l="Adres" w={z.faktura?.adres} />
            </tbody>
          </table>
        </section>
      ) : null}

      {/* rozbudowany formularz (rekrutacje) → odpowiedzi od nowej strony;
          krótki formularz zostaje w miejscu, a tabela i tak łamie się
          wyłącznie między wierszami */}
      <section className={odpowiedzi.length > 12 ? "nowa-strona" : undefined}>
        <h2 style={naglowek}>{z.chceFakture ? "5" : "4"}. Odpowiedzi z formularza zgłoszeniowego</h2>
        {odpowiedzi.length ? (
          <table>
            <thead>
              <tr>
                <th style={{ ...etL, width: "45%", textAlign: "left" }}>Pole formularza</th>
                <th style={{ ...etL, width: "55%", textAlign: "left" }}>Odpowiedź</th>
              </tr>
            </thead>
            <tbody>
              {odpowiedzi.map((o, i) => (
                <tr key={i}>
                  <td style={{ ...etL, width: "45%", fontWeight: 600 }}>{o.pytanie}</td>
                  <td style={et}>{o.odpowiedz || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ margin: "4px 0", color: "#555" }}>Formularz nie zawierał dodatkowych pytań.</p>
        )}
      </section>

      <section className="sekcja">
        <h2 style={naglowek}>{z.chceFakture ? "6" : "5"}. Załączniki i decyzja</h2>
        <table>
          <tbody>
            <Wiersz l="Załączone pliki" w={zalaczniki.length ? zalaczniki.join("; ") : "brak"} />
            <tr>
              <td style={etL}>Decyzja organizatora / podpis</td>
              <td style={{ ...et, height: "52px" }}></td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer style={{ marginTop: "20px", paddingTop: "8px", borderTop: "1px solid #ddd", fontSize: "10.5px", color: "#777" }}>
        Dokument wygenerowany z systemu zapisów na wydarzenia Polskiego
        Towarzystwa Terapii EMDR (wydarzenia.emdr.org.pl) · wygenerowano:{" "}
        {dataPL(new Date().toISOString())} · zgłoszenie nr {String(z.id ?? id)} ·
        zawiera dane osobowe — przechowywać zgodnie z zasadami RODO.
      </footer>
    </main>
  );
}
