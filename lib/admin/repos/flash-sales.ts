import "server-only";
import { sql } from "../db";

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

export async function listFlashSales(opts?: { onlyLive?: boolean }): Promise<FlashSale[]> {
  if (opts?.onlyLive) {
    return sql.all<FlashSale>(
      `SELECT * FROM flash_sales
         WHERE enabled = 1
           AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
           AND ends_at >= CURRENT_TIMESTAMP
         ORDER BY ends_at ASC`,
    );
  }
  return sql.all<FlashSale>("SELECT * FROM flash_sales ORDER BY ends_at DESC");
}

export async function getFlashSale(id: number): Promise<FlashSale | null> {
  return sql.get<FlashSale>("SELECT * FROM flash_sales WHERE id = ?", [id]);
}

export type FlashSaleInput = Omit<FlashSale, "id" | "created_at">;

export async function createFlashSale(input: FlashSaleInput): Promise<number> {
  const r = await sql.run(
    `INSERT INTO flash_sales (title, subtitle, promo_code, banner_image, starts_at, ends_at, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    [
      input.title,
      input.subtitle,
      input.promo_code,
      input.banner_image,
      input.starts_at,
      input.ends_at,
      input.enabled,
    ],
  );
  return Number(r.rows[0].id);
}

export async function updateFlashSale(id: number, patch: Partial<FlashSale>): Promise<void> {
  const cols = ["title","subtitle","promo_code","banner_image","starts_at","ends_at","enabled"] as const;
  const present = cols.filter((c) => c in patch);
  if (!present.length) return;
  const set = present.map((c) => `${c} = ?`);
  const params = present.map((c) => (patch as Record<string, unknown>)[c]);
  params.push(id);
  await sql.run(`UPDATE flash_sales SET ${set.join(", ")} WHERE id = ?`, params);
}

export async function deleteFlashSale(id: number): Promise<void> {
  await sql.run("DELETE FROM flash_sales WHERE id = ?", [id]);
}
