import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../db";

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

export function listAssets(opts?: { folder?: string; q?: string }): MediaAsset[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts?.folder) { where.push("folder = ?"); params.push(opts.folder); }
  if (opts?.q) { where.push("(path LIKE ? OR alt LIKE ?)"); params.push(`%${opts.q}%`, `%${opts.q}%`); }
  const sql = `SELECT * FROM media_assets ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY datetime(created_at) DESC`;
  return getDb().prepare(sql).all(...params) as MediaAsset[];
}

export function listFolders(): string[] {
  const rows = getDb()
    .prepare("SELECT DISTINCT folder FROM media_assets ORDER BY folder ASC")
    .all() as Array<{ folder: string }>;
  return rows.map((r) => r.folder);
}

export function recordAsset(input: {
  path: string;
  alt?: string;
  folder?: string;
  width?: number;
  height?: number;
  bytes?: number;
  mime?: string;
  uploaded_by?: number | null;
}): number {
  const r = getDb().prepare(`
    INSERT OR REPLACE INTO media_assets
      (path, alt, folder, width, height, bytes, mime, uploaded_by)
    VALUES
      (@path, @alt, @folder, @width, @height, @bytes, @mime, @uploaded_by)
  `).run({
    path: input.path,
    alt: input.alt ?? "",
    folder: input.folder ?? "uploads",
    width: input.width ?? null,
    height: input.height ?? null,
    bytes: input.bytes ?? null,
    mime: input.mime ?? "image/webp",
    uploaded_by: input.uploaded_by ?? null,
  });
  return Number(r.lastInsertRowid);
}

export function deleteAsset(id: number): void {
  const db = getDb();
  const row = db.prepare("SELECT path FROM media_assets WHERE id = ?").get(id) as { path: string } | undefined;
  if (!row) return;
  // Try to remove the on-disk file (don't break if it's already gone)
  try {
    const abs = path.resolve(process.cwd(), "public", row.path.replace(/^\//, ""));
    if (abs.startsWith(path.resolve(process.cwd(), "public", "uploads"))) fs.unlinkSync(abs);
  } catch { /* */ }
  db.prepare("DELETE FROM media_assets WHERE id = ?").run(id);
}

export function setAlt(id: number, alt: string): void {
  getDb().prepare("UPDATE media_assets SET alt = ? WHERE id = ?").run(alt, id);
}
