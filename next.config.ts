import type { NextConfig } from "next";
import path from "node:path";
import { IMAGE_DEVICE_SIZES, IMAGE_SIZES } from "./lib/image-widths";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin Turbopack's workspace root explicitly so it doesn't pick up the
  // orphan package-lock.json sitting in C:/Users/JOYISA/.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Images: Vercel's Image Optimization is NOT used (Hobby quota was
  // exceeded). Instead the custom loader sends product photos to our own
  // resizer, /api/img, whose output the CDN caches for a year. The size
  // lists drive the <Image> srcset and are the only widths /api/img accepts.
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    deviceSizes: [...IMAGE_DEVICE_SIZES],
    imageSizes: [...IMAGE_SIZES],
  },
  // One host for search engines: www.elitezonej.com served a full duplicate
  // of the site. Permanent redirect to the bare domain (matches metadataBase).
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.elitezonej.com" }],
        destination: "https://elitezonej.com/:path*",
        permanent: true,
      },
    ];
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
