import "server-only";
import { sql } from "../db";
import type { HomeSection } from "../types";

export async function listHomeSections(): Promise<HomeSection[]> {
  return sql.all<HomeSection>(
    "SELECT * FROM home_sections ORDER BY sort_order ASC",
  );
}

export async function getHomeSection(key: string): Promise<HomeSection | null> {
  return sql.get<HomeSection>("SELECT * FROM home_sections WHERE key = ?", [key]);
}

export async function updateHomeSection(key: string, patch: Partial<HomeSection>): Promise<void> {
  const cols = ["title","kicker","body","image_path","link_text","link_href","sort_order","enabled","extras_json"] as const;
  const present = cols.filter((c) => c in patch);
  if (!present.length) return;
  const set = present.map((c) => `${c} = ?`);
  const params = present.map((c) => (patch as Record<string, unknown>)[c]);
  params.push(key);
  await sql.run(`UPDATE home_sections SET ${set.join(", ")} WHERE key = ?`, params);
}
