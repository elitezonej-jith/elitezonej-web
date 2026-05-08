import "server-only";
import { getDb } from "../db";

export type FlashSale = {
  id: number;
  title: string;
  subtitle: string;
  promo_code: string | null;
  banner_image: string;
  starts_at: string | null;
  ends_at: string;
  enabled: number;
  created_at: string;
};

export function listFlashSales(opts?: { onlyLive?: boolean }): FlashSale[] {
  const db = getDb();
  if (opts?.onlyLive) {
    return db
      .prepare(
        `SELECT * FROM flash_sales
         WHERE enabled = 1
           AND (starts_at IS NULL OR datetime(starts_at) <= datetime('now'))
           AND datetime(ends_at) >= datetime('now')
         ORDER BY datetime(ends_at) ASC`,
      )
      .all() as FlashSale[];
  }
  return db.prepare("SELECT * FROM flash_sales ORDER BY datetime(ends_at) DESC").all() as FlashSale[];
}

export function getFlashSale(id: number): FlashSale | null {
  return (getDb().prepare("SELECT * FROM flash_sales WHERE id = ?").get(id) as FlashSale | undefined) ?? null;
}

export type FlashSaleInput = Omit<FlashSale, "id" | "created_at">;

export function createFlashSale(input: FlashSaleInput): number {
  const r = getDb().prepare(`
    INSERT INTO flash_sales (title, subtitle, promo_code, banner_image, starts_at, ends_at, enabled)
    VALUES (@title, @subtitle, @promo_code, @banner_image, @starts_at, @ends_at, @enabled)
  `).run(input);
  return Number(r.lastInsertRowid);
}

export function updateFlashSale(id: number, patch: Partial<FlashSale>): void {
  const cols = ["title","subtitle","promo_code","banner_image","starts_at","ends_at","enabled"];
  const set = cols.filter((c) => c in patch).map((c) => `${c} = @${c}`);
  if (!set.length) return;
  getDb().prepare(`UPDATE flash_sales SET ${set.join(", ")} WHERE id = @id`).run({ id, ...patch });
}

export function deleteFlashSale(id: number): void {
  getDb().prepare("DELETE FROM flash_sales WHERE id = ?").run(id);
}
