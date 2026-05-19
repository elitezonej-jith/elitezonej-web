"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { subscribe } from "../../../lib/admin/repos/newsletter";
import { logAudit } from "../../../lib/admin/repos/audit";
import { rateLimit } from "../../../lib/admin/rate-limit";

const Schema = z.object({ email: z.string().email().max(160) });

export type NewsletterState = { ok?: boolean; error?: string };

export async function subscribeNewsletter(
  _prev: NewsletterState,
  fd: FormData,
): Promise<NewsletterState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = rateLimit(`news:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return { error: "Please try again later." };

  const parsed = Schema.safeParse({ email: String(fd.get("email") ?? "").trim().toLowerCase() });
  if (!parsed.success) return { error: "Enter a valid email address." };

  const result = await subscribe(parsed.data.email, "footer");
  if (result === "new" || result === "resubscribed") {
    await logAudit({
      user_id: null,
      action: "newsletter_subscribe",
      entity: "newsletter",
      entity_id: parsed.data.email,
    });
  }
  return { ok: true };
}
