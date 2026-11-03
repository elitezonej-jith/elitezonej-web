import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { ALLOWED_IMAGE_WIDTHS, BLOB_HOST } from "@/lib/image-widths";

// Self-hosted image resizer. Vercel's Image Optimization is off (Hobby quota),
// so without this every phone downloaded the full-size original. The loader
// (lib/image-loader.ts) points <Image> here with a width from the srcset; the
// result is cached by Vercel's CDN for a year, so each variant is generated
// once. On any failure we redirect to the original, so an image never breaks.
export const runtime = "nodejs";

const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const MAX_PIXELS = 24_000_000;
const LOCAL_PREFIXES = ["/generated/", "/uploads/"];

function resolveSource(raw: string, origin: string): string | null {
  if (raw.startsWith("/")) {
    if (raw.includes("..") || !LOCAL_PREFIXES.some((p) => raw.startsWith(p))) return null;
    return origin + raw;
  }
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && u.hostname === BLOB_HOST ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  const sp = req.nextUrl.searchParams;
  const raw = sp.get("url") ?? "";
  const w = Number(sp.get("w"));
  const q = Math.min(90, Math.max(40, Number(sp.get("q")) || 75));

  const src = resolveSource(raw, req.nextUrl.origin);
  if (!src || !ALLOWED_IMAGE_WIDTHS.includes(w)) {
    return new NextResponse("Bad image request", { status: 400 });
  }

  try {
    const res = await fetch(src, { cache: "no-store" });
    if (!res.ok) throw new Error(`source ${res.status}`);
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_INPUT_BYTES) throw new Error("source too large");
    const input = Buffer.from(await res.arrayBuffer());
    if (input.length > MAX_INPUT_BYTES) throw new Error("source too large");

    const img = sharp(input, { failOn: "truncated", limitInputPixels: MAX_PIXELS });
    const out = await img
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: q, effort: 4 })
      .toBuffer();

    return new NextResponse(new Uint8Array(out), {
      headers: {
        "Content-Type": "image/webp",
        // Source URLs are content-addressed (unique upload names), so the
        // variant never changes: cache it everywhere for a year.
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch (e) {
    console.warn("[img] falling back to original:", (e as Error).message, src);
    return NextResponse.redirect(src, { status: 307, headers: { "Cache-Control": "no-store" } });
  }
}
