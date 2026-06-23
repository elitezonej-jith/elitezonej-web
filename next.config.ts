import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin Turbopack's workspace root explicitly so it doesn't pick up the
  // orphan package-lock.json sitting in C:/Users/JOYISA/.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Source images are now compressed WebP (~80 KB each) so the optimizer
  // no longer OOMs the worker. Re-enabled to serve responsive variants
  // and modern formats per viewport.
  images: {
    // Images are pre-compressed WebP (~83KB avg). Vercel Image Optimization
    // quota is exceeded on Hobby plan — serve directly without transformation.
    // Blob-hosted images bypass via the custom loader; local /generated images
    // are already optimized at generation time.
    unoptimized: true,
    formats: ["image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
  serverExternalPackages: ["better-sqlite3"],
  // Client router cache (in-browser, per-session, keyed by route segment —
  // NOT a shared server cache). Re-warms back/forward & repeat navigations.
  // `dynamic: 30`: dynamic/cookie-reading pages (login/signup/account) may
  //   reuse their RSC payload for 30s within the SAME browser only; the server
  //   still renders per request, so no cross-user/auth leakage (staleTimes.md
  //   :7,27-30; prefetching.md:191-193 — client cache is per-browser memory).
  // `static: 180`: statically rendered pages (e.g. home) keep their prefetched
  //   shell for 3 min (default is 5 min — we shorten it, conservative).
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
};

export default nextConfig;
