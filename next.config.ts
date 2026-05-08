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
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
