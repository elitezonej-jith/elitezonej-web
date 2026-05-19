import "server-only";
import { sql } from "../db";

export type HomepageBlockType =
  | "hero_grid" | "hero_banner" | "banner_carousel"
  | "product_carousel" | "editorial_split" | "service_cards"
  | "process_strip" | "full_banner" | "trust_strip"
  | "wedding_editorial" | "bespoke_teaser" | "category_grid"
  | "announce_bar" | "promo_modal"
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

export async function listBlocks(opts?: { onlyEnabled?: boolean }): Promise<HomepageBlockResolved[]> {
  const query = `SELECT * FROM homepage_blocks ${opts?.onlyEnabled ? "WHERE enabled = 1" : ""} ORDER BY sort_order ASC, id ASC`;
  return (await sql.all<HomepageBlock>(query)).map(resolve);
}

export async function getBlock(id: number): Promise<HomepageBlockResolved | null> {
  const r = await sql.get<HomepageBlock>("SELECT * FROM homepage_blocks WHERE id = ?", [id]);
  return r ? resolve(r) : null;
}

export type HomepageBlockInput = {
  type: HomepageBlockType;
  title?: string;
  kicker?: string;
  config: Record<string, unknown>;
  enabled?: number;
};

export async function createBlock(input: HomepageBlockInput): Promise<number> {
  const maxRow = await sql.get<{ m: number | string }>(
    "SELECT COALESCE(MAX(sort_order),0) as m FROM homepage_blocks",
  );
  const max = Number(maxRow?.m ?? 0);
  const r = await sql.run(
    `INSERT INTO homepage_blocks (type, title, kicker, config_json, sort_order, enabled)
    VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
    [
      input.type,
      input.title ?? "",
      input.kicker ?? "",
      JSON.stringify(input.config ?? {}),
      max + 10,
      input.enabled ?? 1,
    ],
  );
  return Number(r.rows[0].id);
}

export async function updateBlock(
  id: number,
  patch: Partial<{ title: string; kicker: string; config: Record<string, unknown>; enabled: number }>,
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (patch.title !== undefined) { sets.push("title = ?"); params.push(patch.title); }
  if (patch.kicker !== undefined) { sets.push("kicker = ?"); params.push(patch.kicker); }
  if (patch.config !== undefined) { sets.push("config_json = ?"); params.push(JSON.stringify(patch.config)); }
  if (patch.enabled !== undefined) { sets.push("enabled = ?"); params.push(patch.enabled); }
  if (!sets.length) return;
  sets.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  await sql.run(`UPDATE homepage_blocks SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function deleteBlock(id: number): Promise<void> {
  await sql.run("DELETE FROM homepage_blocks WHERE id = ?", [id]);
}

export async function reorderBlocks(orderedIds: number[]): Promise<void> {
  await sql.tx(async (t) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await t.run("UPDATE homepage_blocks SET sort_order = ? WHERE id = ?", [
        (i + 1) * 10,
        orderedIds[i],
      ]);
    }
  });
}
