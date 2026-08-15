import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import "../(publiczna)/globals.css";

const figtree = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-figtree" });
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Karty wydarzeń — panel PTT EMDR",
  robots: { index: false, follow: false },
};

/** Panel raportowy (Karty wydarzeń) — dostęp tylko dla zalogowanej obsługi. */
export default function LayoutPanelu({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${figtree.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-mist/40 font-sans">
        <div className="bg-navy text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 text-sm">
            <a href="/panel" className="font-bold tracking-wide">
              Karty wydarzeń · panel obsługi PTT EMDR
            </a>
            <span className="flex gap-4">
              <a href="/admin" className="text-white/80 hover:text-sun">
                Panel danych (CRUD)
              </a>
              <a href="/" target="_blank" className="text-white/80 hover:text-sun">
                Strona zapisów ↗
              </a>
            </span>
          </div>
        </div>
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
