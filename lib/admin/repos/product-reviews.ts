import "server-only";
import { sql } from "../db";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ProductReview = {
  id: number;
  product_slug: string;
  customer_id: number | null;
  customer_name: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  created_at: string;
};

export type ReviewAggregate = {
  avg: number; // 0 when count=0
  count: number;
};

/** Public-facing list (approved by default). */
export async function listForProduct(
  slug: string,
  status: ReviewStatus = "approved",
): Promise<ProductReview[]> {
  return sql.all<ProductReview>(
    `SELECT * FROM product_reviews
     WHERE product_slug = ? AND status = ?
     ORDER BY created_at DESC`,
    [slug, status],
  );
}

/** Moderation queue. */
export async function listPending(limit = 50): Promise<ProductReview[]> {
  return sql.all<ProductReview>(
    `SELECT * FROM product_reviews WHERE status = 'pending'
     ORDER BY created_at ASC LIMIT ?`,
    [limit],
  );
}

/** All reviews for studio (any status), newest first. */
export async function listAll(limit = 200): Promise<ProductReview[]> {
  return sql.all<ProductReview>(
    `SELECT * FROM product_reviews ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
}

export async function getReview(id: number): Promise<ProductReview | null> {
  return sql.get<ProductReview>(`SELECT * FROM product_reviews WHERE id = ?`, [id]);
}

/** Customer submit. Always lands as 'pending' regardless of caller. */
export async function createReview(input: {
  product_slug: string;
  customer_id: number | null;
  customer_name: string;
  rating: number;
  title?: string;
  body: string;
}): Promise<number> {
  const r = await sql.run(
    `INSERT INTO product_reviews
       (product_slug, customer_id, customer_name, rating, title, body, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')
     RETURNING id`,
    [
      input.product_slug,
      input.customer_id,
      input.customer_name,
      input.rating,
      input.title ?? "",
      input.body,
    ],
  );
  return Number(r.rows[0].id);
}

export async function setStatus(id: number, status: ReviewStatus): Promise<void> {
  await sql.run(`UPDATE product_reviews SET status = ? WHERE id = ?`, [status, id]);
}

export async function deleteReview(id: number): Promise<void> {
  await sql.run(`DELETE FROM product_reviews WHERE id = ?`, [id]);
}

/** Aggregate over approved reviews only. */
export async function getAggregateForProduct(slug: string): Promise<ReviewAggregate> {
  const row = await sql.get<{ n: number | string; s: number | string | null }>(
    `SELECT COUNT(*) as n, SUM(rating) as s
     FROM product_reviews WHERE product_slug = ? AND status = 'approved'`,
    [slug],
  );
  const count = Number(row?.n ?? 0);
  const sum = Number(row?.s ?? 0);
  return { count, avg: count > 0 ? sum / count : 0 };
}

/** Count pending reviews (for studio sidebar badge). */
export async function countPending(): Promise<number> {
  const row = await sql.get<{ n: number | string }>(
    `SELECT COUNT(*) as n FROM product_reviews WHERE status = 'pending'`,
  );
  return Number(row?.n ?? 0);
}
