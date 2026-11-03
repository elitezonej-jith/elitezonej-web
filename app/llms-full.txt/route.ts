import { buildLlmsFullTxt } from "@/lib/storefront/ai-summary";

// /llms-full.txt — plain-text site summary for AI assistants (see lib/storefront/ai-summary.ts).
// Rendered on request and cached at the edge for an hour, so the build doesn't
// need the database.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return new Response(await buildLlmsFullTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
