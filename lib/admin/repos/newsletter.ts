import "server-only";
import { sql } from "../db";
import type { NewsletterSubscriber } from "../types";

/** Idempotent on email — a re-subscribe re-activates a previously opted-out row. */
export async function subscribe(
  email: string,
  source = "footer",
): Promise<"new" | "exists" | "resubscribed"> {
  const existing = await sql.get<{ id: number; status: string }>(
    "SELECT id, status FROM newsletter_subscribers WHERE email = ?",
    [email],
  );
  if (existing) {
    if (existing.status === "subscribed") return "exists";
    await sql.run(
      "UPDATE newsletter_subscribers SET status = 'subscribed' WHERE id = ?",
      [existing.id],
    );
    return "resubscribed";
  }
  await sql.run(
    "INSERT INTO newsletter_subscribers (email, source) VALUES (?, ?)",
    [email, source],
  );
  return "new";
}

export async function listSubscribers(limit = 200): Promise<NewsletterSubscriber[]> {
  return sql.all<NewsletterSubscriber>(
    "SELECT * FROM newsletter_subscribers ORDER BY created_at DESC LIMIT ?",
    [limit],
  );
}

export async function countSubscribers(): Promise<number> {
  const row = await sql.get<{ n: number | string }>(
    "SELECT COUNT(*) AS n FROM newsletter_subscribers WHERE status = 'subscribed'",
  );
  return Number(row?.n ?? 0);
}
