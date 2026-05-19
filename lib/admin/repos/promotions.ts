import "server-only";
import { sql } from "../db";
import type { Promotion, PromoStatus } from "../types";

export async function listPromotions(): Promise<Promotion[]> {
  return sql.all<Promotion>("SELECT * FROM promotions ORDER BY created_at DESC");
}

export async function getPromotion(code: string): Promise<Promotion | null> {
  return sql.get<Promotion>("SELECT * FROM promotions WHERE code = ?", [code]);
}

export async function upsertPromotion(p: Omit<Promotion, "usage_count" | "created_at">): Promise<void> {
  await sql.run(
    `INSERT INTO promotions (code, type, value, starts_at, ends_at, min_total, usage_limit, status, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET
       type = excluded.type, value = excluded.value, starts_at = excluded.starts_at,
       ends_at = excluded.ends_at, min_total = excluded.min_total,
       usage_limit = excluded.usage_limit, status = excluded.status, description = excluded.description`,
    [
      p.code,
      p.type,
      p.value,
      p.starts_at,
      p.ends_at,
      p.min_total,
      p.usage_limit,
      p.status,
      p.description,
    ],
  );
}

export async function deletePromotion(code: string): Promise<void> {
  await sql.run("DELETE FROM promotions WHERE code = ?", [code]);
}

export async function setPromotionStatus(code: string, status: PromoStatus): Promise<void> {
  await sql.run("UPDATE promotions SET status = ? WHERE code = ?", [status, code]);
}
