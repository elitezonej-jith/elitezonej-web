import { NextResponse } from "next/server";
import { getSearchIndex } from "@/lib/storefront/products";

// The search overlay's product index (~300 items with descriptions, ~450 KB
// of JSON). It used to be passed from <Header> as a prop, which embedded it
// in the HTML of every storefront page. Now it is fetched once, on demand,
// when the visitor goes to use search. Same cached read path and invalidation
// (CACHE_TAGS.products) as before.
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const index = await getSearchIndex();
  return NextResponse.json(index, {
    headers: {
      // Browser keeps it 5 min; Vercel's CDN serves it for 5 min and
      // refreshes in the background for up to a day.
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
