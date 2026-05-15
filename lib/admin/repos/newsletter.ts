import "server-only";
import { getDb } from "../db";
import type { NewsletterSubscriber } from "../types";

/** Idempotent on email — a re-subscribe re-activates a previously opted-out row. */
export function subscribe(email: string, source = "footer"): "new" | "exists" | "resubscribed" {
  const db = getDb();
  const existing = db
    .prepare("SELECT id, status FROM newsletter_subscribers WHERE email = ?")
    .get(email) as { id: number; status: string } | undefined;
  if (existing) {
    if (existing.status === "subscribed") return "exists";
    db.prepare("UPDATE newsletter_subscribers SET status = 'subscribed' WHERE id = ?").run(existing.id);
    return "resubscribed";
  }
  db.prepare("INSERT INTO newsletter_subscribers (email, source) VALUES (?, ?)").run(email, source);
  return "new";
}

export function listSubscribers(limit = 200): NewsletterSubscriber[] {
  return getDb()
    .prepare("SELECT * FROM newsletter_subscribers ORDER BY datetime(created_at) DESC LIMIT ?")
    .all(limit) as NewsletterSubscriber[];
}

export function countSubscribers(): number {
  return (
    getDb()
      .prepare("SELECT COUNT(*) AS n FROM newsletter_subscribers WHERE status = 'subscribed'")
      .get() as { n: number }
  ).n;
}
