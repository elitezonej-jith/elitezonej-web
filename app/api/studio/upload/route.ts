import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import path from "node:path";
import fs from "node:fs/promises";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { SESSION_COOKIE, getSessionUser } from "../../../../lib/admin/auth";
import { recordAsset } from "../../../../lib/admin/repos/media-assets";

export const runtime = "nodejs";

const SAFE_FOLDER = /^[a-z0-9_-]+(\/[a-z0-9_-]+)*$/i;

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
  // Auth
  const c = await cookies();
  const me = getSessionUser(c.get(SESSION_COOKIE)?.value);
  if (!me) return new NextResponse("Unauthorized", { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    return new NextResponse("Could not read form data: " + (e as Error).message, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof Blob)) return new NextResponse("No file uploaded", { status: 400 });
  const folderRaw = String(form.get("folder") ?? "uploads");
  const folder = safeFolder(folderRaw);
  const maxWidth = Number(form.get("maxWidth") ?? 2400);

  // Hard cap: 12 MB raw input
  if (file.size > 12 * 1024 * 1024) {
    return new NextResponse("File too large (max 12 MB)", { status: 413 });
  }

  // Read + transform via sharp
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  let pipeline = sharp(inputBuffer, { failOn: "none" }).rotate();
  const meta = await pipeline.metadata();

  if (meta.width && meta.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }
  const out = await pipeline
    .webp({ quality: 84, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  const origName = (file as File).name ?? "upload";
  const filename = safeName(origName);
  const dirAbs = path.resolve(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dirAbs, { recursive: true });
  const outAbs = path.join(dirAbs, filename);
  await fs.writeFile(outAbs, out.data);

  const publicPath = `/uploads/${folder}/${filename}`;
  recordAsset({
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
