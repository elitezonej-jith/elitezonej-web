import "server-only";
// Storefront-side read helpers. Pull live product data from the admin DB so
// every studio edit is visible on the public site immediately.

import { cache } from "react";
import { getDb } from "../admin/db";
import { listProducts as listAdminProducts } from "../admin/repos/products";
import { getMeta } from "../admin/repos/product-meta";
import { listImages, getThumbnail, fallbackImages } from "../admin/repos/product-images";
import type { Product } from "../admin/types";

export type StorefrontProduct = Product & {
  meta: ReturnType<typeof getMeta>;
  images: string[];
  thumbnail: string | null;
};

function decorate(p: Product): StorefrontProduct {
  const meta = getMeta(p.slug);
  const dbImages = listImages(p.slug).map((i) => i.image_path);
  const images = dbImages.length ? dbImages : fallbackImages(p.slug);
  const thumb = getThumbnail(p.slug) ?? images[0] ?? null;
  return { ...p, meta, images, thumbnail: thumb };
}

export const getProduct = cache(_getProduct);
function _getProduct(slug: string): StorefrontProduct | null {
  const db = getDb();
  const r = db.prepare("SELECT * FROM products WHERE slug = ? AND status = 'active'").get(slug) as
    | { sizes_json: string; features_json: string; spec_json: string } & Omit<Product, "sizes" | "features" | "spec">
    | undefined;
  if (!r) return null;
  const product: Product = {
    ...r,
    sizes: JSON.parse(r.sizes_json) as string[],
    features: JSON.parse(r.features_json) as string[],
    spec: JSON.parse(r.spec_json) as [string, string][],
  };
  return decorate(product);
}

type ListFilter = {
  gender?: "men" | "women" | "unisex";
  category?: string;
  sub?: string;
  kind?: "tailored" | "fabric";
  featured?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  limit?: number;
};

// Per-request memoisation keyed by the serialised filter — repeated
// carousels with identical filters hit the DB once per render pass.
const _listProductsByKey = cache((_key: string, filter?: ListFilter) =>
  _listProducts(filter),
);

export function listProducts(filter?: ListFilter): StorefrontProduct[] {
  return _listProductsByKey(JSON.stringify(filter ?? {}), filter);
}

function _listProducts(filter?: ListFilter): StorefrontProduct[] {
  const opts: Parameters<typeof listAdminProducts>[0] = {
    status: "active",
    kind: filter?.kind,
    gender: filter?.gender,
    category: filter?.category,
    limit: filter?.limit ?? 100,
  };
  let products = listAdminProducts(opts);
  if (filter?.sub) products = products.filter((p) => p.sub === filter.sub);
  let result = products.map(decorate);
  if (filter?.featured) result = result.filter((p) => p.meta.is_featured === 1);
  if (filter?.trending) result = result.filter((p) => p.meta.is_trending === 1);
  if (filter?.newArrival) result = result.filter((p) => p.meta.is_new_arrival === 1);
  return result;
}
