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
import { listColours } from "../admin/repos/product-colours";
import { listImages } from "../admin/repos/product-images";

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
    // postgres.js returns `timestamptz` as JS `Date`; CollectionClient sort
    // calls `.localeCompare` which is string-only. Coerce so the SQLite (text)
    // and Postgres (Date) paths agree.
    createdAt: ((): string | undefined => {
      const v = p.created_at as unknown;
      if (v instanceof Date) return v.toISOString();
      if (typeof v === "string") return v;
      return undefined;
    })(),
    sizeGuide: p.size_guide || undefined,
    images: p.images,
    thumbnail: p.thumbnail,
    shortDescription: p.meta?.short_description || undefined,
    isNewArrival: p.meta?.is_new_arrival === 1,
    isFeatured: p.meta?.is_featured === 1,
    isTrending: p.meta?.is_trending === 1,
    isPremium: p.meta?.is_premium === 1,
  };
}

export async function getProductForPage(slug: string): Promise<LegacyProduct | null> {
  const fromDb = await dbGetProduct(slug);
  if (fromDb) {
    const product = adaptDbProduct(fromDb);
    // Load tailored colour variants (fabric variants use fabric_colours instead)
    if (product.kind !== "fabric") {
      const colours = await listColours(slug);
      if (colours.length > 0) {
        product.productColours = colours.map((c) => ({
          id: c.id,
          name: c.name,
          hex: c.hex,
          is_default: c.is_default,
        }));
        // Build image→colour map so PDP can filter gallery by selected colour
        const imgRows = await listImages(slug);
        if (imgRows.length > 0) {
          const map: Record<string, number | null> = {};
          for (const r of imgRows) map[r.image_path] = r.colour_id;
          product.imageColourMap = map;
        }
      }
    }
    return product;
  }
  return staticGetProduct(slug) ?? null;
}
