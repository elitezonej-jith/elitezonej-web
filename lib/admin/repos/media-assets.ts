import "server-only";
import fs from "node:fs";
import path from "node:path";
import { sql } from "../db";

export type MediaAsset = {
  id: number;
  path: string;
  alt: string;
  folder: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  mime: string;
  uploaded_by: number | null;
  created_at: string;
};

export async function listAssets(opts?: { folder?: string; q?: string }): Promise<MediaAsset[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts?.folder) { where.push("folder = ?"); params.push(opts.folder); }
  if (opts?.q) { where.push("(path LIKE ? OR alt LIKE ?)"); params.push(`%${opts.q}%`, `%${opts.q}%`); }
  const query = `SELECT * FROM media_assets ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY created_at DESC`;
  return sql.all<MediaAsset>(query, params);
}

export async function listFolders(): Promise<string[]> {
  const rows = await sql.all<{ folder: string }>(
    "SELECT DISTINCT folder FROM media_assets ORDER BY folder ASC",
  );
  return rows.map((r) => r.folder);
}

export async function recordAsset(input: {
  path: string;
  alt?: string;
  folder?: string;
  width?: number;
  height?: number;
  bytes?: number;
  mime?: string;
  uploaded_by?: number | null;
}): Promise<number> {
  const r = await sql.run(
    `INSERT INTO media_assets
      (path, alt, folder, width, height, bytes, mime, uploaded_by)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(path) DO UPDATE SET
      alt         = excluded.alt,
      folder      = excluded.folder,
      width       = excluded.width,
      height      = excluded.height,
      bytes       = excluded.bytes,
      mime        = excluded.mime,
      uploaded_by = excluded.uploaded_by
    RETURNING id`,
    [
      input.path,
      input.alt ?? "",
      input.folder ?? "uploads",
      input.width ?? null,
      input.height ?? null,
      input.bytes ?? null,
      input.mime ?? "image/webp",
      input.uploaded_by ?? null,
    ],
  );
  return Number(r.rows[0].id);
}

export async function deleteAsset(id: number): Promise<void> {
  const row = await sql.get<{ path: string }>(
    "SELECT path FROM media_assets WHERE id = ?",
    [id],
  );
  if (!row) return;
  // Try to remove the on-disk file (don't break if it's already gone)
  try {
    const abs = path.resolve(process.cwd(), "public", row.path.replace(/^\//, ""));
    if (abs.startsWith(path.resolve(process.cwd(), "public", "uploads"))) fs.unlinkSync(abs);
  } catch { /* */ }
  await sql.run("DELETE FROM media_assets WHERE id = ?", [id]);
}

export async function setAlt(id: number, alt: string): Promise<void> {
  await sql.run("UPDATE media_assets SET alt = ? WHERE id = ?", [alt, id]);
}
