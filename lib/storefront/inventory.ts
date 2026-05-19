import "server-only";
import { sql } from "../admin/db";

// Browse-time stock read. Mirrors the inventory columns checkout.ts reads
// (SELECT stock, oos_flag FROM inventory) but is its OWN query — the
// ring-fenced checkout module is never imported or modified. Returns one
// batched map (no N+1) of slug -> set of out-of-stock size labels, used to
// overlay the legacy `sizes[]` "-oos" suffix the catalogue UI already expects.
export async function getStockMap(): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>();
  const rows = await sql.all<{
    product_slug: string;
    size: string;
    stock: number;
    oos_flag: number;
  }>("SELECT product_slug, size, stock, oos_flag FROM inventory");
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
