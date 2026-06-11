import "server-only";
import { updateTag } from "next/cache";

// Single source of truth for storefront cache tags. The read side
// (lib/storefront/products.ts, nav.ts, inventory.ts) wraps DB reads in
// `unstable_cache(..., { tags: [...] })` using these constants; the write side
// (Studio/Admin server actions) calls the bust* helpers below so an edit
// invalidates the matching cache. Keeping the names here prevents the read tag
// and the write tag from silently drifting apart.
//
// We intentionally use ONE coarse `products` tag (not per-slug): any product
// edit can add/remove/reorder a product within a list, so busting every
// product cache is the correct, race-free choice — and it trivially covers the
// slug-rename case (old + new both invalidated).
export const CACHE_TAGS = {
  products: "products",
  categories: "categories",
  inventory: "inventory",
} as const;

/** Invalidate every cached storefront product list + single-product read. */
export function bustProducts(): void {
  updateTag(CACHE_TAGS.products);
}

/** Invalidate the cached nav / category-overlay reads. */
export function bustCategories(): void {
  updateTag(CACHE_TAGS.categories);
}

/** Invalidate the cached browse-time stock map. */
export function bustInventory(): void {
  updateTag(CACHE_TAGS.inventory);
}
