import "server-only";
import { getDb } from "../db";

export type HomepageBlockType =
  | "hero_grid" | "hero_banner" | "banner_carousel"
  | "product_carousel" | "editorial_split" | "service_cards"
  | "process_strip" | "full_banner" | "trust_strip"
  | "wedding_editorial" | "bespoke_teaser" | "category_grid"
  | "custom_html";

export type HomepageBlock = {
  id: number;
  type: HomepageBlockType;
  title: string;
  kicker: string;
  config_json: string;
  sort_order: number;
  enabled: number;
  created_at: string;
  updated_at: string;
};

export type HomepageBlockResolved = HomepageBlock & { config: Record<string, unknown> };

function resolve(b: HomepageBlock): HomepageBlockResolved {
  let config: Record<string, unknown> = {};
  try { config = JSON.parse(b.config_json || "{}"); } catch { /* */ }
  return { ...b, config };
}

export function listBlocks(opts?: { onlyEnabled?: boolean }): HomepageBlockResolved[] {
  const db = getDb();
  const sql = `SELECT * FROM homepage_blocks ${opts?.onlyEnabled ? "WHERE enabled = 1" : ""} ORDER BY sort_order ASC, id ASC`;
  return (db.prepare(sql).all() as HomepageBlock[]).map(resolve);
}

export function getBlock(id: number): HomepageBlockResolved | null {
  const r = getDb().prepare("SELECT * FROM homepage_blocks WHERE id = ?").get(id) as HomepageBlock | undefined;
  return r ? resolve(r) : null;
}

export type HomepageBlockInput = {
  type: HomepageBlockType;
  title?: string;
  kicker?: string;
  config: Record<string, unknown>;
  enabled?: number;
};

export function createBlock(input: HomepageBlockInput): number {
  const db = getDb();
  const max = (db.prepare("SELECT COALESCE(MAX(sort_order),0) as m FROM homepage_blocks").get() as { m: number }).m;
  const r = db.prepare(`
    INSERT INTO homepage_blocks (type, title, kicker, config_json, sort_order, enabled)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    input.type,
    input.title ?? "",
    input.kicker ?? "",
    JSON.stringify(input.config ?? {}),
    max + 10,
    input.enabled ?? 1,
  );
  return Number(r.lastInsertRowid);
}

export function updateBlock(
  id: number,
  patch: Partial<{ title: string; kicker: string; config: Record<string, unknown>; enabled: number }>,
): void {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id };
  if (patch.title !== undefined) { sets.push("title = @title"); params.title = patch.title; }
  if (patch.kicker !== undefined) { sets.push("kicker = @kicker"); params.kicker = patch.kicker; }
  if (patch.config !== undefined) { sets.push("config_json = @config_json"); params.config_json = JSON.stringify(patch.config); }
  if (patch.enabled !== undefined) { sets.push("enabled = @enabled"); params.enabled = patch.enabled; }
  if (!sets.length) return;
  sets.push("updated_at = datetime('now')");
  getDb().prepare(`UPDATE homepage_blocks SET ${sets.join(", ")} WHERE id = @id`).run(params);
}

export function deleteBlock(id: number): void {
  getDb().prepare("DELETE FROM homepage_blocks WHERE id = ?").run(id);
}

export function reorderBlocks(orderedIds: number[]): void {
  const db = getDb();
  const stmt = db.prepare("UPDATE homepage_blocks SET sort_order = ? WHERE id = ?");
  const tx = db.transaction(() => {
    orderedIds.forEach((id, i) => stmt.run((i + 1) * 10, id));
  });
  tx();
}
