import "server-only";
// Storefront-side read helpers. Pull live product data from the admin DB so
// every studio edit is visible on the public site immediately.

import { unstable_cache } from "next/cache";
import { sql } from "../admin/db";
import { listProducts as listAdminProducts } from "../admin/repos/products";
import { getMetaForSlugs, emptyMeta, type ProductMeta } from "../admin/repos/product-meta";
import { listImagesForSlugs, fallbackImages, thumbnailFromImages } from "../admin/repos/product-images";
import { CACHE_TAGS } from "./cache";
import type { Product } from "../admin/types";
import {
  PRODUCTS as STATIC_PRODUCTS,
  type FabricColour,
} from "../products";

export type StorefrontProduct = Product & {
  meta: ProductMeta;
  images: string[];
  thumbnail: string | null;
};

// Batched decoration for a list of products — ONE meta query + ONE images query
// for the whole page instead of 3-4 queries per product (the old N+1). Each
// product's fallback behaviour is preserved exactly: missing meta →
// `emptyMeta(slug)`, missing DB images → `fallbackImages(slug)`, thumbnail via
// the same `is_thumbnail`-then-first rule as the single-slug `getThumbnail`.
async function decorateList(products: Product[]): Promise<StorefrontProduct[]> {
  const slugs = products.map((p) => p.slug);
  const [metaMap, imagesMap] = await Promise.all([
    getMetaForSlugs(slugs),
    listImagesForSlugs(slugs),
  ]);
  return products.map((p) => {
    const meta = metaMap.get(p.slug) ?? emptyMeta(p.slug);
    const imgRows = imagesMap.get(p.slug) ?? [];
    const dbImages = imgRows.map((i) => i.image_path);
    const images = dbImages.length ? dbImages : fallbackImages(p.slug);
    const thumb = thumbnailFromImages(imgRows) ?? images[0] ?? null;
    return { ...p, meta, images, thumbnail: thumb };
  });
}

// Single-product decoration reuses the batched path (drops the extra
// `getThumbnail` query the old single path made).
async function decorate(p: Product): Promise<StorefrontProduct> {
  return (await decorateList([p]))[0];
}

// Cross-request cache: a single-product read served from cache until a Studio/
// Admin edit calls `bustProducts()` (or the 1h TTL lapses). Keyed by slug.
export const getProduct = unstable_cache(
  _getProduct,
  ["storefront-product"],
  { revalidate: 3600, tags: [CACHE_TAGS.products] },
);
async function _getProduct(slug: string): Promise<StorefrontProduct | null> {
  const r = await sql.get<
    { sizes_json: string; features_json: string; spec_json: string } & Omit<Product, "sizes" | "features" | "spec">
  >("SELECT * FROM products WHERE slug = ? AND status = 'active'", [slug]);
  if (!r) return null;
  const product: Product = {
    ...r,
    sizes: JSON.parse(r.sizes_json) as string[],
    features: JSON.parse(r.features_json) as string[],
    spec: JSON.parse(r.spec_json) as [string, string][],
  };
  return decorate(product);
}

export type ListFilter = {
  gender?: "men" | "women" | "unisex";
  category?: string;
  sub?: string;
  kind?: "tailored" | "fabric";
  featured?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  limit?: number;
};

// Cross-request cache. `unstable_cache` keys on the static key parts PLUS the
// serialised call arguments, so each distinct filter caches separately. The
// list is served from cache (no Neon round-trips) until a product edit calls
// `bustProducts()` or the 1h TTL lapses — this is what eliminates the
// per-request Neon egress. `_key` is the serialised filter, kept as an explicit
// argument so the cache key is stable and human-readable.
const _listProductsCached = unstable_cache(
  async (_key: string, filter?: ListFilter) => _listProducts(filter),
  ["storefront-products"],
  { revalidate: 3600, tags: [CACHE_TAGS.products] },
);

export function listProducts(filter?: ListFilter): Promise<StorefrontProduct[]> {
  return _listProductsCached(JSON.stringify(filter ?? {}), filter);
}

async function _listProducts(filter?: ListFilter): Promise<StorefrontProduct[]> {
  const opts: Parameters<typeof listAdminProducts>[0] = {
    status: "active",
    kind: filter?.kind,
    gender: filter?.gender,
    category: filter?.category,
    limit: filter?.limit ?? 100,
  };
  let products = await listAdminProducts(opts);
  if (filter?.sub) products = products.filter((p) => p.sub === filter.sub);
  let result = await decorateList(products);
  if (filter?.featured) result = result.filter((p) => p.meta.is_featured === 1);
  if (filter?.trending) result = result.filter((p) => p.meta.is_trending === 1);
  if (filter?.newArrival) result = result.filter((p) => p.meta.is_new_arrival === 1);
  return result;
}

// ── Slim search index ────────────────────────────────────────────────────
// The client search overlay (`SearchOverlay`) only needs a handful of fields
// to match + render results. Shipping the full `LegacyProduct[]` (with
// `sizes`/`features`/`spec`/`note`/images/meta blobs) into the RSC payload +
// client bundle on every storefront route is wasteful. `getSearchIndex()`
// returns ONLY the fields the overlay reads — keeping search behaviour
// identical while cutting the serialised size dramatically. Reuses the same
// cached read path as `listProducts()` (same product cache tag) so it shares
// invalidation with the rest of the storefront catalogue.
export type SearchIndexItem = {
  slug: string;
  name: string;
  cat: string;
  line: string;
  price: number;
  salePrice?: number;
  fit: string;
  fabric: string;
  occasion: string;
  gender: "men" | "women" | "unisex";
  category: string;
  kind?: "fabric";
  description?: string;
  // Fabric-only fields the overlay uses for swatch image src + colour chips.
  colour?: string;
  colourHex?: string;
  colourVariants?: FabricColour[];
};

// Fabric extras still live on the static catalogue record (mirrors the
// `adaptDbProduct` lookup), keyed by slug for an O(1) join.
const STATIC_BY_SLUG = new Map(STATIC_PRODUCTS.map((p) => [p.slug, p] as const));

const _getSearchIndexCached = unstable_cache(
  async (): Promise<SearchIndexItem[]> => {
    const products = await listProducts();
    return products.map((p): SearchIndexItem => {
      const staticMatch = STATIC_BY_SLUG.get(p.slug);
      return {
        slug: p.slug,
        name: p.name,
        cat: p.cat,
        line: p.line,
        price: p.price,
        salePrice: p.sale_price ?? undefined,
        fit: p.fit,
        fabric: p.fabric,
        occasion: p.occasion,
        gender: p.gender,
        category: p.category,
        kind: p.kind === "fabric" ? "fabric" : undefined,
        description: p.description ?? staticMatch?.description,
        colour: staticMatch?.colour,
        colourHex: staticMatch?.colourHex,
        colourVariants: staticMatch?.colourVariants,
      };
    });
  },
  ["storefront-search-index"],
  { revalidate: 3600, tags: [CACHE_TAGS.products] },
);

export function getSearchIndex(): Promise<SearchIndexItem[]> {
  return _getSearchIndexCached();
}
