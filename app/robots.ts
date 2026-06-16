import type { MetadataRoute } from "next";

// Keep in sync with metadataBase in app/layout.tsx. Overridable per-env.
const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://elitezonej.com"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Operator surfaces + customer-private + API: never index.
      disallow: ["/admin", "/studio", "/account", "/checkout", "/api"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
