import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import path from "node:path";
import fs from "node:fs/promises";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { SESSION_COOKIE, getSessionUser } from "../../../../lib/admin/auth";
import { recordAsset } from "../../../../lib/admin/repos/media-assets";

export const runtime = "nodejs";

// Storage backend: Vercel Blob when BLOB_READ_WRITE_TOKEN is set (prod + any
// preview that has the integration), otherwise fall back to the local
// `public/uploads/` filesystem (dev). Same call shape either way — only
// `recordAsset.path` differs (relative path locally, absolute https URL on
// Blob). The PDP / Studio image renderers accept either.
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

const SAFE_FOLDER = /^[a-z0-9_-]+(\/[a-z0-9_-]+)*$/i;
const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "image/avif", "image/gif",
]);
const MAX_PIXELS = 24_000_000; // 24 megapixels

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Some user-agents omit Origin on same-origin POSTs; fall back to Referer.
    const referer = req.headers.get("referer");
    if (!referer) return false;
    try {
      const r = new URL(referer);
      const h = req.headers.get("host");
      return !!h && r.host === h;
    } catch {
      return false;
    }
  }
  try {
    const o = new URL(origin);
    const h = req.headers.get("host");
    return !!h && o.host === h;
  } catch {
    return false;
  }
}

function safeFolder(raw: string): string {
  const f = raw.replace(/^\/+|\/+$/g, "");
  if (!SAFE_FOLDER.test(f)) return "uploads";
  return f;
}

function safeName(filename: string): string {
  const ext = "webp";
  const base = filename.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "file";
  const stamp = Date.now().toString(36) + randomBytes(3).toString("hex");
  return `${base}-${stamp}.${ext}`;
}

export async function POST(req: NextRequest) {
  // Same-origin CSRF check
  if (!sameOrigin(req)) return new NextResponse("Forbidden", { status: 403 });

  // Auth
  const c = await cookies();
  const me = await getSessionUser(c.get(SESSION_COOKIE)?.value);
  if (!me) return new NextResponse("Unauthorized", { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    return new NextResponse("Could not read form data: " + (e as Error).message, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof Blob)) return new NextResponse("No file uploaded", { status: 400 });

  // MIME allowlist
  if (!ALLOWED_MIME.has(file.type)) {
    return new NextResponse(`Unsupported file type: ${file.type || "unknown"}`, { status: 415 });
  }

  const folderRaw = String(form.get("folder") ?? "uploads");
  const folder = safeFolder(folderRaw);
  const maxWidth = Number(form.get("maxWidth") ?? 2400);

  // Hard cap: 12 MB raw input
  if (file.size > 12 * 1024 * 1024) {
    return new NextResponse("File too large (max 12 MB)", { status: 413 });
  }

  // Read + transform via sharp
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  let pipeline = sharp(inputBuffer, { failOn: "truncated" }).rotate();
  let meta;
  try {
    meta = await pipeline.metadata();
  } catch (e) {
    return new NextResponse("Image could not be decoded: " + (e as Error).message, { status: 400 });
  }

  // Authoritative type check: trust sharp's decoded format, not the
  // client-supplied multipart MIME header (file.type is attacker-controlled).
  const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "tiff"]);
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    return new NextResponse(`Unsupported image format: ${meta.format ?? "unknown"}`, { status: 415 });
  }

  // Pixel-area cap defends against decompression bombs.
  if (meta.width && meta.height && meta.width * meta.height > MAX_PIXELS) {
    return new NextResponse("Image dimensions too large (max 24 megapixels)", { status: 413 });
  }

  if (meta.width && meta.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }
  const out = await pipeline
    .webp({ quality: 84, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  const origName = (file as File).name ?? "upload";
  const filename = safeName(origName);

  let publicPath: string;
  if (USE_BLOB) {
    // Vercel Blob: addRandomSuffix=false because `safeName()` already adds a
    // unique suffix; access:"public" so the storefront <Image> can fetch it.
    const blob = await put(`uploads/${folder}/${filename}`, out.data, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
    });
    publicPath = blob.url;
  } else {
    const dirAbs = path.resolve(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(dirAbs, { recursive: true });
    const outAbs = path.join(dirAbs, filename);
    await fs.writeFile(outAbs, out.data);
    publicPath = `/uploads/${folder}/${filename}`;
  }

  await recordAsset({
    path: publicPath,
    folder,
    width: out.info.width,
    height: out.info.height,
    bytes: out.info.size,
    mime: "image/webp",
    uploaded_by: me.id,
  });

  return NextResponse.json({
    path: publicPath,
    width: out.info.width,
    height: out.info.height,
    bytes: out.info.size,
  });
}
