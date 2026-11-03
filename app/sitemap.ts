import type { MetadataRoute } from "next";
import { listProductsForPage } from "@/lib/storefront/catalogue";
import { getStorefrontNav } from "@/lib/storefront/nav";

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
    // Category pages, at their canonical URLs (see generateMetadata in
    // app/collection/page.tsx). Bare /collection is not canonical.
    ...["men", "women", "new", "fabrics", "accessories"].map((c) => ({
      url: `${BASE_URL}/collection?c=${c}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    { url: `${BASE_URL}/premium`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
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
      // Product photos, so Google Images can index them with the product.
      images: (p.images ?? [])
        .slice(0, 4)
        .map((u) => (u.startsWith("/") ? `${BASE_URL}${u}` : u)),
    }));
  } catch {
    productRoutes = [];
  }

  // Subcategory pages from the live menu (e.g. /collection?c=men&sub=business-suits).
  let subcategoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const nav = await getStorefrontNav();
    const hrefs = new Set<string>();
    for (const cat of nav) {
      for (const g of cat.groups ?? []) {
        for (const it of g.items) {
          if (/^\/collection\?c=[a-z0-9-]+&sub=[a-z0-9-]+$/.test(it.href)) hrefs.add(it.href);
        }
      }
    }
    subcategoryRoutes = [...hrefs].map((h) => ({
      // Next.js writes <loc> verbatim, so "&" must be pre-escaped for valid XML.
      url: `${BASE_URL}${h.replace(/&/g, "&amp;")}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    subcategoryRoutes = [];
  }

  return [...staticRoutes, ...subcategoryRoutes, ...productRoutes];
}
