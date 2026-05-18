import "server-only";
// Server-only helper that returns a product in the legacy `lib/products.ts`
// shape used by client components. Prefers the live admin DB and falls back
// to the static catalogue for slugs that haven't been migrated yet.

import { getProduct as dbGetProduct, type StorefrontProduct } from "./products";
import {
  PRODUCTS as STATIC_PRODUCTS,
  getProduct as staticGetProduct,
  type Product as LegacyProduct,
} from "../products";

export function adaptDbProduct(p: StorefrontProduct): LegacyProduct {
  // Reconstruct a legacy-shape Product from the DB row + static metadata
  // (if a static record exists for the same slug, prefer its fabric extras).
  const staticMatch = STATIC_PRODUCTS.find((s) => s.slug === p.slug);
  return {
    slug: p.slug,
    name: p.name,
    cat: p.cat,
    catLink: p.cat_link,
    price: p.price,
    salePrice: p.sale_price ?? undefined,
    line: p.line,
    sizes: p.sizes,
    features: p.features,
    spec: p.spec,
    note: p.note,
    fit: p.fit,
    fabric: p.fabric,
    occasion: p.occasion,
    badge: p.badge,
    gender: p.gender,
    category: p.category,
    sub: p.sub ?? undefined,
    kind: p.kind === "fabric" ? "fabric" : undefined,
    description: p.description ?? staticMatch?.description,
    // Fabric-only extras stay on the static record for now.
    colour: staticMatch?.colour,
    colourHex: staticMatch?.colourHex,
    colourVariants: staticMatch?.colourVariants,
    fabricMeta: staticMatch?.fabricMeta,
  };
}

export function getProductForPage(slug: string): LegacyProduct | null {
  const fromDb = dbGetProduct(slug);
  if (fromDb) return adaptDbProduct(fromDb);
  return staticGetProduct(slug) ?? null;
}
