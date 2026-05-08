import "server-only";
import { getDb } from "../db";
import type { HomeSection } from "../types";

export function listHomeSections(): HomeSection[] {
  return getDb()
    .prepare("SELECT * FROM home_sections ORDER BY sort_order ASC")
    .all() as HomeSection[];
}

export function getHomeSection(key: string): HomeSection | null {
  return (getDb().prepare("SELECT * FROM home_sections WHERE key = ?").get(key) as HomeSection | undefined) ?? null;
}

export function updateHomeSection(key: string, patch: Partial<HomeSection>): void {
  const cols = ["title","kicker","body","image_path","link_text","link_href","sort_order","enabled","extras_json"];
  const set = cols.filter((c) => c in patch).map((c) => `${c} = @${c}`);
  if (!set.length) return;
  getDb()
    .prepare(`UPDATE home_sections SET ${set.join(", ")} WHERE key = @key`)
    .run({ key, ...patch });
}
