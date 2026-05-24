import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root explicitly so it doesn't pick up the
  // orphan package-lock.json sitting in C:/Users/JOYISA/.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Source images are now compressed WebP (~80 KB each) so the optimizer
  // no longer OOMs the worker. Re-enabled to serve responsive variants
  // and modern formats per viewport.
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Allow next/image to optimise uploads served from Vercel Blob.
    // Bucket subdomains follow `*.public.blob.vercel-storage.com`.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
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
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
