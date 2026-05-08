import "server-only";
import { getDb } from "../db";
import type { Promotion, PromoStatus } from "../types";

export function listPromotions(): Promotion[] {
  return getDb().prepare("SELECT * FROM promotions ORDER BY datetime(created_at) DESC").all() as Promotion[];
}

export function getPromotion(code: string): Promotion | null {
  return (getDb().prepare("SELECT * FROM promotions WHERE code = ?").get(code) as Promotion | undefined) ?? null;
}

export function upsertPromotion(p: Omit<Promotion, "usage_count" | "created_at">): void {
  getDb()
    .prepare(
      `INSERT INTO promotions (code, type, value, starts_at, ends_at, min_total, usage_limit, status, description)
       VALUES (@code, @type, @value, @starts_at, @ends_at, @min_total, @usage_limit, @status, @description)
       ON CONFLICT(code) DO UPDATE SET
         type = excluded.type, value = excluded.value, starts_at = excluded.starts_at,
         ends_at = excluded.ends_at, min_total = excluded.min_total,
         usage_limit = excluded.usage_limit, status = excluded.status, description = excluded.description`,
    )
    .run(p);
}

export function deletePromotion(code: string): void {
  getDb().prepare("DELETE FROM promotions WHERE code = ?").run(code);
}

export function setPromotionStatus(code: string, status: PromoStatus): void {
  getDb().prepare("UPDATE promotions SET status = ? WHERE code = ?").run(status, code);
}
