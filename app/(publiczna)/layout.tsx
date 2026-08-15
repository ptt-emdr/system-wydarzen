import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin", "latin-ext"],
  variable: "--font-figtree",
});
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Wydarzenia — Polskie Towarzystwo Terapii EMDR",
  description:
    "Zapisy na szkolenia, superwizje i wydarzenia Polskiego Towarzystwa Terapii EMDR.",
  robots: { index: false, follow: false }, // noindex do dnia wdrożenia
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${figtree.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <div className="bg-navy text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-2 text-sm">
            <span className="font-semibold tracking-wide">
              Wydarzenia PTT EMDR
            </span>
            <a
              href="https://emdr.org.pl"
              target="_blank"
              rel="noopener"
              className="text-white/80 transition hover:text-sun"
            >
              emdr.org.pl
            </a>
          </div>
        </div>
        <header className="border-b border-ink/10 bg-white">
          <div className="mx-auto flex max-w-5xl items-baseline justify-between px-5 py-4">
            <a href="/" className="leading-tight">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark">
                Polskie Towarzystwo Terapii EMDR
              </span>
              <span className="font-display text-2xl font-semibold text-navy">
                Szkolenia i wydarzenia
              </span>
            </a>
            <a
              href="/"
              className="hidden text-sm font-semibold text-brand-deep transition hover:text-navy sm:block"
            >
              Wszystkie wydarzenia
            </a>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-16 border-t border-ink/10 bg-cream/60">
          <div className="mx-auto flex max-w-5xl flex-col gap-1 px-5 py-6 text-sm text-ink/70 sm:flex-row sm:justify-between">
            <span>© Polskie Towarzystwo Terapii EMDR</span>
            <span>
              Kontakt:{" "}
              <a className="underline hover:text-navy" href="mailto:sekretarz@emdr.org.pl">
                sekretarz@emdr.org.pl
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
