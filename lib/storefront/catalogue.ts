import "server-only";
// Live-DB catalogue list in the legacy `Product` shape every browsing UI
// already consumes. Reuses the proven adapter (product-for-page.ts) so no
// render/filter logic changes anywhere — only the data source becomes the DB.

import { listProducts, type ListFilter } from "./products";
import { adaptDbProduct } from "./product-for-page";
import { getStockMap } from "./inventory";
import {
  PRODUCTS as STATIC_PRODUCTS,
  type Product as LegacyProduct,
} from "../products";

// Preserve the static catalogue's array order — that is the storefront's
// historical default ("newest") ordering. Keeping it identical guarantees the
// pre-DB and post-DB browse views are byte-for-byte the same on a fresh seed.
// Slugs absent from the static array sort after, by name.
const STATIC_INDEX = new Map(STATIC_PRODUCTS.map((p, i) => [p.slug, i] as const));

export function listProductsForPage(filter?: ListFilter): LegacyProduct[] {
  const oosBySlug = getStockMap();
  const out = listProducts(filter).map((p) => {
    const legacy = adaptDbProduct(p);
    // Overlay DB-accurate out-of-stock onto the legacy sizes[] "-oos"
    // convention the catalogue UI already filters/renders on. Only authoritative
    // when the product has inventory rows; otherwise keep the seeded sizes.
    const oos = oosBySlug.get(legacy.slug);
    if (oos && oos.size && Array.isArray(legacy.sizes) && legacy.sizes.length) {
      legacy.sizes = legacy.sizes.map((s) => {
        const base = s.replace(/-oos$/, "");
        return oos.has(base) ? `${base}-oos` : base;
      });
    }
    return legacy;
  });
  out.sort((a, b) => {
    const ai = STATIC_INDEX.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const bi = STATIC_INDEX.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
    return ai !== bi ? ai - bi : a.name.localeCompare(b.name);
  });
  return out;
}
