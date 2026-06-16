import type { MetadataRoute } from "next";
import { listProductsForPage } from "@/lib/storefront/catalogue";

// Keep in sync with metadataBase in app/layout.tsx. Overridable per-env.
const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://elitezonej.com"
).replace(/\/$/, "");

// Render at request time, not build time: the build runner can't reach Neon
// (the same reason home/PDP are force-dynamic), so prerendering the product
// list here would fail the build. Generated on demand and CDN-cached.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/collection`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/bespoke`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/size-guide`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Never let a transient DB issue 500 the sitemap — fall back to static routes.
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await listProductsForPage();
    productRoutes = products.map((p) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      // createdAt is an ISO string for DB rows; absent for static-only entries.
      lastModified: p.createdAt ? new Date(p.createdAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...productRoutes];
}
