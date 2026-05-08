import "server-only";
import { getDb } from "../db";

export type Banner = {
  id: number;
  title: string;
  subtitle: string;
  button_text: string;
  button_href: string;
  image_path: string;
  mobile_image_path: string;
  text_align: "left" | "center" | "right";
  text_color: "light" | "dark";
  starts_at: string | null;
  ends_at: string | null;
  status: "draft" | "scheduled" | "published";
  enabled: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function listBanners(opts?: { onlyPublished?: boolean }): Banner[] {
  const db = getDb();
  if (opts?.onlyPublished) {
    return db
      .prepare(
        `SELECT * FROM banners
         WHERE enabled = 1
           AND status = 'published'
           AND (starts_at IS NULL OR datetime(starts_at) <= datetime('now'))
           AND (ends_at   IS NULL OR datetime(ends_at)   >= datetime('now'))
         ORDER BY sort_order ASC, id ASC`,
      )
      .all() as Banner[];
  }
  return db.prepare("SELECT * FROM banners ORDER BY sort_order ASC, id ASC").all() as Banner[];
}

export function getBanner(id: number): Banner | null {
  return (getDb().prepare("SELECT * FROM banners WHERE id = ?").get(id) as Banner | undefined) ?? null;
}

export type BannerInput = Omit<Banner, "id" | "created_at" | "updated_at" | "sort_order"> & { sort_order?: number };

export function createBanner(input: BannerInput): number {
  const db = getDb();
  const max = (db.prepare("SELECT COALESCE(MAX(sort_order),0) as m FROM banners").get() as { m: number }).m;
  const r = db.prepare(`
    INSERT INTO banners
      (title, subtitle, button_text, button_href, image_path, mobile_image_path,
       text_align, text_color, starts_at, ends_at, status, enabled, sort_order)
    VALUES
      (@title, @subtitle, @button_text, @button_href, @image_path, @mobile_image_path,
       @text_align, @text_color, @starts_at, @ends_at, @status, @enabled, @sort_order)
  `).run({ ...input, sort_order: input.sort_order ?? max + 10 });
  return Number(r.lastInsertRowid);
}

export function updateBanner(id: number, patch: Partial<Banner>): void {
  const cols = ["title","subtitle","button_text","button_href","image_path","mobile_image_path",
                "text_align","text_color","starts_at","ends_at","status","enabled","sort_order"];
  const set = cols.filter((c) => c in patch).map((c) => `${c} = @${c}`);
  if (!set.length) return;
  set.push(`updated_at = datetime('now')`);
  getDb()
    .prepare(`UPDATE banners SET ${set.join(", ")} WHERE id = @id`)
    .run({ id, ...patch });
}

export function deleteBanner(id: number): void {
  getDb().prepare("DELETE FROM banners WHERE id = ?").run(id);
}

export function reorderBanners(orderedIds: number[]): void {
  const db = getDb();
  const stmt = db.prepare("UPDATE banners SET sort_order = ? WHERE id = ?");
  const tx = db.transaction(() => {
    orderedIds.forEach((id, i) => stmt.run((i + 1) * 10, id));
  });
  tx();
}
