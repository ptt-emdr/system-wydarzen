import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

/* STATIC_EXPORT=1 npm run build → statyczny eksport do folderu `out/`
   (do wrzucenia np. na Netlify Drop). Bez tej flagi build działa normalnie
   (tryb serwerowy — potrzebny w etapie 2 pod Payload CMS). */
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  /* obrazy bez optymalizatora serwerowego — grafiki są lokalne i lekkie,
     a build ze standalone działa wtedy identycznie na macOS i na serwerze
     cyber_Folks (bez binarnych zależności zależnych od platformy) */
  images: { unoptimized: true },
  ...(isStaticExport
    ? { output: "export" as const }
    : /* build serwerowy (cyber_Folks): samowystarczalny pakiet Node */
      { output: "standalone" as const }),
  /* ograniczenie równoległości builda — na serwerze współdzielonym
     nie chcemy spawnować dziesiątek procesów */
  experimental: {
    cpus: 4,
  },
  /* SKIP_TYPECHECK=1 (tylko build na serwerze cyber_Folks): weryfikator
     TypeScript przekracza limit wątków LVE; typy są zawsze sprawdzane
     w buildzie lokalnym przed wysyłką */
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPECHECK === "1",
  },
  /* strona nie może zdradzać, na czym stoi */
  poweredByHeader: false,
  /* nagłówki bezpieczeństwa (audyt 19.08.2026) — HSTS bez preload,
     CSP na razie wyłącznie raportująco (panel Payload używa inline
     skryptów/stylów; zaostrzenie po okresie obserwacji) */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
