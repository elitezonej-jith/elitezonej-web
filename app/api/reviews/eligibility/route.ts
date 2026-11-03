import { NextResponse, type NextRequest } from "next/server";
import { getCurrentCustomer } from "@/lib/storefront/session";
import { hasCustomerPurchased, hasExistingReview } from "@/lib/admin/repos/product-reviews";

// Per-visitor review eligibility for a product page. Kept out of the page
// itself so /products/[slug] can be cached and served from the edge (a
// cookie read in the page would force it to render on every request).
// submitReviewAction re-checks all of this server-side on submit.
export const dynamic = "force-dynamic";

export type ReviewState = "anon" | "not_purchased" | "already_reviewed" | "can_write";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const headers = { "Cache-Control": "private, no-store" };
  const me = await getCurrentCustomer();
  if (!me || !slug) return NextResponse.json({ reviewState: "anon" satisfies ReviewState }, { headers });
  const [purchased, alreadyReviewed] = await Promise.all([
    hasCustomerPurchased(me.id, slug),
    hasExistingReview(me.id, slug),
  ]);
  const reviewState: ReviewState = alreadyReviewed
    ? "already_reviewed"
    : purchased
      ? "can_write"
      : "not_purchased";
  return NextResponse.json({ reviewState }, { headers });
}
