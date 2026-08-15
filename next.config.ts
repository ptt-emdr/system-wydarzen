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
};

export default withPayload(nextConfig);
