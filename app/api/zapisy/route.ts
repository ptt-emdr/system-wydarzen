import { getPayload } from "payload";
import config from "@payload-config";
import {
  kwotaZaTerminy,
  aktualnaCena,
  zajetosc,
  formatujKwote,
  eskapujHtml,
  type WydarzenieDoc,
} from "@/lib/wydarzenia";

/* proste ograniczenie częstotliwości (jak w formularzach strony głównej):
   maks. 5 zgłoszeń na godzinę z jednego adresu IP — chroni skrzynkę SMTP
   i bazę przed zautomatyzowanym spamem; jeden proces Node = mapa wystarcza */
const zgloszeniaZIp = new Map<string, number[]>();
function zaCzesto(ip: string): boolean {
  const teraz = Date.now();
  const okno = (zgloszeniaZIp.get(ip) ?? []).filter((t) => teraz - t < 3_600_000);
  /* 10/h — kilka osób z jednej instytucji (wspólne IP) może zgłaszać się
     na rekrutację tego samego dnia; licznik zeruje się przy restarcie */
  if (okno.length >= 10) return true;
  okno.push(teraz);
  zgloszeniaZIp.set(ip, okno);
  return false;
}

/**
 * Przyjęcie zgłoszenia z formularza (multipart). Cała logika po stronie
 * serwera: ponowna walidacja, kontrola limitów miejsc, wyliczenie kwoty
 * i terminu płatności, zapis załączników (kolekcja chroniona), e-mail
 * z instrukcją przelewu. Zwraca dane do ekranu potwierdzenia.
 */
export async function POST(req: Request) {
  /* załączniki zapisane zanim walidacja dalszych pól się wywali —
     sprzątane przy każdym błędzie, żeby nie zostawały sieroty */
  let sprzatnijZalaczniki: () => Promise<void> = async () => {};
  try {
    const dane = await req.formData();
    const payload = await getPayload({ config });

    /* pole-pułapka na boty: prawdziwy formularz zostawia je puste */
    if (String(dane.get("www") || "").trim()) {
      return Response.json({ ok: true });
    }
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "nieznane";
    if (zaCzesto(ip)) {
      return Response.json(
        { blad: "Zbyt wiele zgłoszeń — spróbuj ponownie później." },
        { status: 429 },
      );
    }

    const wydarzenieId = String(dane.get("wydarzenieId") || "");
    const imie = String(dane.get("imie") || "").trim();
    const nazwisko = String(dane.get("nazwisko") || "").trim();
    const email = String(dane.get("email") || "").trim();
    const telefon = String(dane.get("telefon") || "").trim();
    const zgodaRodo = dane.get("zgodaRodo") === "tak";
    if (!wydarzenieId || !imie || !nazwisko || !email || !zgodaRodo) {
      return Response.json({ blad: "Uzupełnij wymagane pola." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { blad: "Podany adres e-mail wygląda na nieprawidłowy." },
        { status: 400 },
      );
    }

    const w = (await payload.findByID({
      collection: "wydarzenia",
      id: wydarzenieId,
      depth: 0,
      overrideAccess: true,
    })) as unknown as WydarzenieDoc;
    if (!w || !w.opublikowane) {
      return Response.json({ blad: "Zapisy na to wydarzenie są zamknięte." }, { status: 400 });
    }
    if (
      w.trybZapisu === "wydarzenie" &&
      w.zapisyDo &&
      new Date() > new Date(w.zapisyDo)
    ) {
      return Response.json(
        { blad: "Zgłoszenia na to wydarzenie zostały już zakończone." },
        { status: 409 },
      );
    }

    /* ---- terminy i limity ---- */
    let wybrane: string[] = [];
    let naListeRezerwowa = false;
    const wymagaAkceptacji = Boolean(
      (w as { akceptacjaUczestnikow?: boolean }).akceptacjaUczestnikow,
    );
    const { lacznie, naTermin } = await zajetosc(payload, w.id);
    if (w.trybZapisu === "terminy") {
      try {
        wybrane = JSON.parse(String(dane.get("terminy") || "[]"));
      } catch {
        wybrane = [];
      }
      const znane = (w.terminy || []).map((t) => t.nazwa);
      wybrane = wybrane.filter((n) => znane.includes(n));
      if (wybrane.length === 0) {
        return Response.json({ blad: "Wybierz co najmniej jeden termin." }, { status: 400 });
      }
      const teraz = new Date();
      for (const nazwa of wybrane) {
        const t = (w.terminy || []).find((x) => x.nazwa === nazwa)!;
        if (t.zapisyDo && teraz > new Date(t.zapisyDo)) {
          return Response.json({ blad: `Zapisy na „${nazwa}” są już zamknięte.` }, { status: 409 });
        }
        if (t.limit && (naTermin[nazwa] || 0) >= t.limit) {
          return Response.json({ blad: `Brak wolnych miejsc na „${nazwa}”.` }, { status: 409 });
        }
      }
    } else if (w.limitMiejsc && lacznie >= w.limitMiejsc) {
      if ((w as { listaRezerwowa?: boolean }).listaRezerwowa) {
        naListeRezerwowa = true; // zapis przyjęty, ale na listę rezerwową
      } else {
        return Response.json({ blad: "Brak wolnych miejsc." }, { status: 409 });
      }
    }

    /* ---- odpowiedzi i załączniki wg kreatora pól ---- */
    const odpowiedzi: { pytanie: string; odpowiedz: string }[] = [];
    const zalacznikiIds: number[] = [];
    sprzatnijZalaczniki = async () => {
      for (const idZal of zalacznikiIds) {
        try {
          await payload.delete({ collection: "zalaczniki-zgloszen", id: idZal, overrideAccess: true });
        } catch {}
      }
    };
    for (let i = 0; i < (w.pola || []).length; i++) {
      const p = (w.pola || [])[i];
      if (p.typ === "info") continue;
      if (p.typ === "zalacznik") {
        const plik = dane.get(`plik-${i}`);
        if (plik instanceof File && plik.size > 0) {
          if (plik.size > 10 * 1024 * 1024) {
            await sprzatnijZalaczniki();
            return Response.json({ blad: `Załącznik „${p.etykieta}” przekracza 10 MB.` }, { status: 400 });
          }
          const bufor = Buffer.from(await plik.arrayBuffer());
          const utworzony = await payload.create({
            collection: "zalaczniki-zgloszen",
            /* odniesienie do wydarzenia — dzięki niemu administrator
               jednego wydarzenia widzi tylko swoje załączniki */
            data: { wydarzenie: Number(wydarzenieId) },
            file: {
              data: bufor,
              name: `${Date.now()}-${plik.name}`.replace(/[^a-zA-Z0-9._-]/g, "_"),
              mimetype: plik.type || "application/octet-stream",
              size: plik.size,
            },
            overrideAccess: true,
          });
          zalacznikiIds.push(utworzony.id);
          odpowiedzi.push({ pytanie: p.etykieta, odpowiedz: `załącznik: ${plik.name}` });
        } else if (p.wymagane) {
          await sprzatnijZalaczniki();
          return Response.json({ blad: `Załącznik „${p.etykieta}” jest wymagany.` }, { status: 400 });
        }
        continue;
      }
      if (p.typ === "wybor") {
        const wartosci = dane
          .getAll(`pole-${i}`)
          .map((x) => String(x).trim())
          .filter(Boolean);
        if (p.wymagane && wartosci.length === 0) {
          await sprzatnijZalaczniki();
          return Response.json({ blad: `Zaznacz co najmniej jedną odpowiedź w „${p.etykieta}”.` }, { status: 400 });
        }
        if (wartosci.length) odpowiedzi.push({ pytanie: p.etykieta, odpowiedz: wartosci.join("; ") });
        continue;
      }
      const wartosc = String(dane.get(`pole-${i}`) || "").trim();
      if (p.wymagane && !wartosc) {
        await sprzatnijZalaczniki();
        return Response.json({ blad: `Pole „${p.etykieta}” jest wymagane.` }, { status: 400 });
      }
      if (wartosc) odpowiedzi.push({ pytanie: p.etykieta, odpowiedz: wartosc });
    }

    /* ---- kwota i termin płatności ---- */
    const kwotaNalezna =
      w.trybZapisu === "terminy" ? kwotaZaTerminy(w, wybrane) : aktualnaCena(w).cena;
    /* bez terminu płatności tylko na liście rezerwowej; weryfikacja
       dokumentów (akceptacja) NIE wstrzymuje płatności — biegnie równolegle */
    const terminPlatnosci =
      kwotaNalezna > 0 && !naListeRezerwowa
        ? new Date(Date.now() + w.dniNaPlatnosc * 24 * 60 * 60 * 1000)
        : null;

    const chceFakture = dane.get("chceFakture") === "tak";
    const zgloszenie = await payload.create({
      collection: "zgloszenia",
      data: {
        imie,
        nazwisko,
        email,
        telefon,
        status: naListeRezerwowa
          ? ("rezerwowa" as const)
          : wymagaAkceptacji
            ? ("doAkceptacji" as const)
            : ("oczekuje" as const),
        wydarzenie: Number(wydarzenieId),
        wybraneTerminy: wybrane.map((nazwa) => ({ nazwa })),
        odpowiedzi,
        zalaczniki: zalacznikiIds,
        kwotaNalezna,
        terminPlatnosci: terminPlatnosci ? terminPlatnosci.toISOString() : undefined,
        chceFakture,
        faktura: chceFakture
          ? {
              nazwa: String(dane.get("fakturaNazwa") || ""),
              nip: String(dane.get("fakturaNip") || ""),
              adres: String(dane.get("fakturaAdres") || ""),
            }
          : undefined,
        zgodaRodo: true,
      },
      overrideAccess: true,
    });

    const kod = `WYD-${zgloszenie.id}`;
    await payload.update({
      collection: "zgloszenia",
      id: zgloszenie.id,
      data: { kodPlatnosci: kod },
      overrideAccess: true,
    });

    /* ---- e-mail powitalny ---- */
    const ustawienia = (await payload.findGlobal({ slug: "ustawienia" })) as {
      rachunek?: { numer?: string; odbiorca?: string };
      emailKontaktowy?: string;
      organizator?: string;
    };
    const rachunek = ustawienia.rachunek?.numer || "";
    const odbiorca = ustawienia.rachunek?.odbiorca || "";
    const terminTekst = terminPlatnosci
      ? terminPlatnosci.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })
      : null;
    const bazaUrl = process.env.PUBLIC_URL || "http://localhost:3100";
    const linkProfilu = `${bazaUrl}/profil/${zgloszenie.id}/${zgloszenie.token}`;

    /* dopisek przy włączonej weryfikacji: płatność normalnie, ale uczciwie
       informujemy o kontroli dokumentów i gwarancji zwrotu */
    const weryfikacjaHtml = wymagaAkceptacji && kwotaNalezna > 0
      ? `<p>Informacja: zgłoszenia na to wydarzenie podlegają weryfikacji
         załączonych dokumentów przez organizatora. Jeżeli rejestracja nie
         zostanie zamknięta pozytywnie, otrzymasz <b>zwrot wpłaconych
         środków</b>.</p>`
      : "";
    const platnoscHtml = naListeRezerwowa
      ? `<p><b>Twoje zgłoszenie trafiło na LISTĘ REZERWOWĄ</b> — limit miejsc
         jest w tej chwili wyczerpany. Nie dokonuj jeszcze żadnej wpłaty.
         Jeżeli zwolni się miejsce, otrzymasz e-mail z potwierdzeniem
         i danymi do przelewu.</p>`
      : kwotaNalezna > 0
        ? `<p>Aby potwierdzić udział, prosimy o przelew${terminTekst ? ` do <b>${terminTekst}</b>` : ""}:</p>
           <table cellpadding="6" style="border-collapse:collapse;background:#f7f3e6;border-radius:8px">
             <tr><td>Kwota</td><td><b>${formatujKwote(kwotaNalezna)}</b></td></tr>
             <tr><td>Rachunek</td><td><b>${rachunek}</b></td></tr>
             <tr><td>Odbiorca</td><td>${odbiorca.replace(/\n/g, "<br>")}</td></tr>
             <tr><td>Tytuł przelewu</td><td><b style="color:#ff370f">${kod}</b></td></tr>
           </table>
           ${w.instrukcjaPlatnosci ? `<p>${w.instrukcjaPlatnosci}</p>` : ""}
           <p>Brak wpłaty w terminie oznacza zwolnienie miejsca.</p>`
        : wymagaAkceptacji
          ? `<p>Twoje zgłoszenie zostało <b>przyjęte i przekazane do
             weryfikacji</b>. Zapis nie wymaga na tym etapie żadnej płatności.
             O wyniku weryfikacji poinformujemy osobnym e-mailem.</p>`
          : `<p>Udział w wydarzeniu jest bezpłatny — Twoje miejsce jest potwierdzone.</p>`;

    /* wstęp e-maila: indywidualna treść z karty wydarzenia (jeśli jest)
       zamiast standardowego „dziękujemy za zgłoszenie…"; reszta (płatność,
       weryfikacja, link do zgłoszenia) zawsze doklejana przez system */
    const wstepHtml = w.trescPotwierdzenia?.trim()
      ? w.trescPotwierdzenia
          .trim()
          .split(/\n{2,}/)
          .map(
            (akapit) =>
              `<p>${eskapujHtml(akapit)
                .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
                .replace(/\n/g, "<br>")}</p>`,
          )
          .join("")
      : `<p>dziękujemy za zgłoszenie na <b>${w.tytul}</b>${
          wybrane.length ? ` (terminy: ${wybrane.join(", ")})` : ""
        }.</p>`;

    try {
      await payload.sendEmail({
        to: email,
        subject: naListeRezerwowa
          ? `Lista rezerwowa: ${w.tytul}`
          : `Zgłoszenie przyjęte: ${w.tytul}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#16303c;line-height:1.5">
          <p>Dzień dobry ${eskapujHtml(imie)},</p>
          ${wstepHtml}
          ${platnoscHtml}
          ${weryfikacjaHtml}
          <p>Stan swojego zgłoszenia sprawdzisz tutaj:<br>
          <a href="${linkProfilu}">${linkProfilu}</a></p>
          <p>W razie pytań: ${ustawienia.emailKontaktowy || "sekretarz@emdr.org.pl"}<br>
          ${ustawienia.organizator || "Polskie Towarzystwo Terapii EMDR"}</p>
        </div>`,
      });
    } catch (e) {
      console.error("E-mail nie wyszedł (zgłoszenie zapisane):", e);
    }

    /* ---- powiadomienie obsługi o nowym zgłoszeniu (21.09.2026) ----
       krótkie (bez danych szczegółowych — te zostają w systemie);
       adresy z karty wydarzenia, domyślnie e-mail kontaktowy z Ustawień */
    try {
      const adresy = String(w.powiadomieniaAdresy || "")
        .split(/[,;\s]+/)
        .map((a) => a.trim())
        .filter((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));
      const doObslugi = adresy.length
        ? adresy
        : [ustawienia.emailKontaktowy || "sekretarz@emdr.org.pl"];
      const statusTekst = naListeRezerwowa
        ? "lista rezerwowa"
        : wymagaAkceptacji
          ? "do akceptacji (weryfikacja)"
          : kwotaNalezna > 0
            ? "oczekuje na wpłatę"
            : "potwierdzone (bezpłatne)";
      await payload.sendEmail({
        to: doObslugi.join(", "),
        subject: `Nowe zgłoszenie: ${w.tytul}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#16303c;line-height:1.5">
          <p>Wpłynęło nowe zgłoszenie na <b>${w.tytul}</b>.</p>
          <p>Osoba: <b>${eskapujHtml(imie)} ${eskapujHtml(nazwisko)}</b><br>
          Status: ${statusTekst}${
            wybrane.length ? `<br>Terminy: ${wybrane.map(eskapujHtml).join(", ")}` : ""
          }</p>
          <p>Szczegóły w panelu:<br>
          <a href="${bazaUrl}/admin/collections/zgloszenia/${zgloszenie.id}">${bazaUrl}/admin/collections/zgloszenia/${zgloszenie.id}</a></p>
        </div>`,
      });
    } catch (e) {
      console.error("Powiadomienie obsługi nie wyszło (zgłoszenie zapisane):", e);
    }

    return Response.json({
      kod,
      kwota: kwotaNalezna,
      rachunek,
      odbiorca,
      terminPlatnosci: terminTekst,
      linkProfilu,
      bezplatne: kwotaNalezna === 0,
      rezerwowa: naListeRezerwowa,
      akceptacja: !naListeRezerwowa && wymagaAkceptacji,
    });
  } catch (e) {
    console.error("Błąd przyjmowania zgłoszenia:", e);
    try {
      await sprzatnijZalaczniki();
    } catch {}
    return Response.json(
      { blad: "Wystąpił błąd — spróbuj ponownie lub napisz do organizatora." },
      { status: 500 },
    );
  }
}
