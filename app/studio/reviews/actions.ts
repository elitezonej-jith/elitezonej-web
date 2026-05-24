"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "../../../lib/admin/session";
import {
  deleteReview,
  getReview,
  setStatus,
  type ReviewStatus,
} from "../../../lib/admin/repos/product-reviews";
import { logAudit } from "../../../lib/admin/repos/audit";

async function ensureModerator() {
  return requireUser("/studio/login");
}

export async function moderateReviewAction(fd: FormData): Promise<void> {
  const me = await ensureModerator();
  const id = Number(fd.get("id"));
  const action = String(fd.get("action") ?? "");
  if (!id) return;
  const valid: ReviewStatus[] = ["pending", "approved", "rejected"];
  if (!(valid as string[]).includes(action)) return;

  const review = await getReview(id);
  if (!review) return;

  await setStatus(id, action as ReviewStatus);
  await logAudit({
    user_id: me.id,
    action: `review_${action}`,
    entity: "product_review",
    entity_id: String(id),
    payload: { slug: review.product_slug },
  });

  // The PDP reads from `listForProduct(slug, "approved")` — re-render it
  // so approved reviews show / disappear immediately.
  revalidatePath(`/products/${review.product_slug}`);
  revalidatePath("/studio/reviews");
}

export async function deleteReviewAction(fd: FormData): Promise<void> {
  const me = await ensureModerator();
  const id = Number(fd.get("id"));
  if (!id) return;
  const review = await getReview(id);
  if (!review) return;

  await deleteReview(id);
  await logAudit({
    user_id: me.id,
    action: "review_delete",
    entity: "product_review",
    entity_id: String(id),
    payload: { slug: review.product_slug },
  });
  revalidatePath(`/products/${review.product_slug}`);
  revalidatePath("/studio/reviews");
}
