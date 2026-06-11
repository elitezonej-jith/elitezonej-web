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
