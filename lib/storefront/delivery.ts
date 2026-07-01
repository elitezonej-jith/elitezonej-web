import "server-only";
import { unstable_cache } from "next/cache";
import { sql } from "../admin/db";
import { CACHE_TAGS } from "./cache";

// Lightweight map of slug → [minDays, maxDays] for all active products that
// have a per-product delivery override. Used by the cart page to compute the
// longest delivery window across all cart items without fetching full product
// records.
export type DeliveryMap = Record<string, { min: number; max: number }>;

export const getDeliveryMap = unstable_cache(
  _getDeliveryMap,
  ["storefront-delivery-map"],
  { revalidate: 3600, tags: [CACHE_TAGS.products] },
);

async function _getDeliveryMap(): Promise<DeliveryMap> {
  const rows = await sql.all<{
    slug: string;
    delivery_min_days: number | null;
    delivery_max_days: number | null;
  }>(
    "SELECT slug, delivery_min_days, delivery_max_days FROM products WHERE delivery_min_days IS NOT NULL",
  );

  const map: DeliveryMap = {};
  for (const r of rows) {
    if (r.delivery_min_days) {
      map[r.slug] = {
        min: r.delivery_min_days,
        max: r.delivery_max_days ?? r.delivery_min_days + 2,
      };
    }
  }
  return map;
}
