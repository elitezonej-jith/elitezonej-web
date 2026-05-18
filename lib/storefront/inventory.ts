import "server-only";
import { getDb } from "../admin/db";

// Browse-time stock read. Mirrors the inventory columns checkout.ts reads
// (SELECT stock, oos_flag FROM inventory) but is its OWN query — the
// ring-fenced checkout module is never imported or modified. Returns one
// batched map (no N+1) of slug -> set of out-of-stock size labels, used to
// overlay the legacy `sizes[]` "-oos" suffix the catalogue UI already expects.
export function getStockMap(): Map<string, Set<string>> {
  const db = getDb();
  const map = new Map<string, Set<string>>();
  const rows = db
    .prepare("SELECT product_slug, size, stock, oos_flag FROM inventory")
    .all() as Array<{
      product_slug: string;
      size: string;
      stock: number;
      oos_flag: number;
    }>;
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
