import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karta zgłoszenia — PTT EMDR",
  robots: { index: false, follow: false },
};

/** Osobny, minimalny layout strony wydruku (bez nagłówka/stopki serwisu). */
export default function KartaLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body style={{ margin: 0, background: "#f2f2f2" }}>{children}</body>
    </html>
  );
}
