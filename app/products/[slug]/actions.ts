"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentCustomer } from "../../../lib/storefront/session";
import { createReview } from "../../../lib/admin/repos/product-reviews";
import { getProductForPage } from "../../../lib/storefront/product-for-page";

const SubmitReviewSchema = z.object({
  slug: z.string().min(1).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(8, "Tell us a bit more (8 characters minimum)").max(2000),
});

export type SubmitReviewState =
  | { ok?: undefined; error?: undefined }
  | { ok: true; error?: undefined }
  | { ok?: undefined; error: string };

export async function submitReviewAction(
  _prev: SubmitReviewState,
  fd: FormData,
): Promise<SubmitReviewState> {
  const me = await getCurrentCustomer();
  if (!me) return { error: "Sign in to write a review." };

  const parsed = SubmitReviewSchema.safeParse({
    slug: fd.get("slug"),
    rating: fd.get("rating"),
    title: fd.get("title") ?? "",
    body: fd.get("body") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid review." };
  }

  // Verify the slug points at a real product (defence-in-depth — FK would
  // also catch this, but the FK error message is opaque).
  const product = await getProductForPage(parsed.data.slug);
  if (!product) return { error: "Product not found." };

  const name = `${me.first_name ?? ""} ${me.last_name ?? ""}`.trim() || "Anonymous";

  await createReview({
    product_slug: parsed.data.slug,
    customer_id: me.id,
    customer_name: name,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
  });

  // The PDP is dynamic so revalidation is mostly a no-op, but call it
  // anyway so the studio moderator badge updates on next request.
  revalidatePath(`/products/${parsed.data.slug}`);
  revalidatePath("/studio/reviews");

  return { ok: true };
}
