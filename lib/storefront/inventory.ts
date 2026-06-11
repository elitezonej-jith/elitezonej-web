import "server-only";
import { unstable_cache } from "next/cache";
import { sql } from "../admin/db";
import { CACHE_TAGS } from "./cache";

// Cached raw stock rows. SHORT 60s TTL on purpose: stock is decremented by the
// ring-fenced order/webhook path (app/api/webhooks/razorpay, repos/orders.ts),
// which we must NOT modify to add a cache bust. So a just-sold size may show
// in-stock for at most 60s — never longer. Studio/Admin inventory edits call
// `bustInventory()` for immediate invalidation. Rows (not the Map) are cached
// because `unstable_cache` only stores JSON-serialisable values.
const _stockRows = unstable_cache(
  async () =>
    sql.all<{
      product_slug: string;
      size: string;
      stock: number;
      oos_flag: number;
    }>("SELECT product_slug, size, stock, oos_flag FROM inventory"),
  ["storefront-stock"],
  { revalidate: 60, tags: [CACHE_TAGS.inventory, CACHE_TAGS.products] },
);

// Browse-time stock read. Mirrors the inventory columns checkout.ts reads
// (SELECT stock, oos_flag FROM inventory) but is its OWN query — the
// ring-fenced checkout module is never imported or modified. Returns one
// batched map (no N+1) of slug -> set of out-of-stock size labels, used to
// overlay the legacy `sizes[]` "-oos" suffix the catalogue UI already expects.
export async function getStockMap(): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>();
  const rows = await _stockRows();
  for (const r of rows) {
    if (r.oos_flag === 1 || r.stock <= 0) {
      let set = map.get(r.product_slug);
      if (!set) {
        set = new Set<string>();
        map.set(r.product_slug, set);
      }
      set.add(r.size);
    }
  }
  return map;
}
