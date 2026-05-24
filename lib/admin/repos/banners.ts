import "server-only";
import { sql } from "../db";

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
  starts_at: string | Date | null;
  ends_at: string | Date | null;
  status: "draft" | "scheduled" | "published";
  enabled: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function listBanners(opts?: { onlyPublished?: boolean }): Promise<Banner[]> {
  if (opts?.onlyPublished) {
    return sql.all<Banner>(
      `SELECT * FROM banners
       WHERE enabled = 1
         AND status = 'published'
         AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
         AND (ends_at   IS NULL OR ends_at   >= CURRENT_TIMESTAMP)
       ORDER BY sort_order ASC, id ASC`,
    );
  }
  return sql.all<Banner>("SELECT * FROM banners ORDER BY sort_order ASC, id ASC");
}

export async function getBanner(id: number): Promise<Banner | null> {
  return sql.get<Banner>("SELECT * FROM banners WHERE id = ?", [id]);
}

export type BannerInput = Omit<Banner, "id" | "created_at" | "updated_at" | "sort_order"> & { sort_order?: number };

export async function createBanner(input: BannerInput): Promise<number> {
  const maxRow = await sql.get<{ m: number | string }>(
    "SELECT COALESCE(MAX(sort_order),0) as m FROM banners",
  );
  const max = Number(maxRow?.m ?? 0);
  const r = await sql.run(
    `INSERT INTO banners
      (title, subtitle, button_text, button_href, image_path, mobile_image_path,
       text_align, text_color, starts_at, ends_at, status, enabled, sort_order)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    [
      input.title,
      input.subtitle,
      input.button_text,
      input.button_href,
      input.image_path,
      input.mobile_image_path,
      input.text_align,
      input.text_color,
      input.starts_at,
      input.ends_at,
      input.status,
      input.enabled,
      input.sort_order ?? max + 10,
    ],
  );
  return Number(r.rows[0].id);
}

export async function updateBanner(id: number, patch: Partial<Banner>): Promise<void> {
  const cols = ["title","subtitle","button_text","button_href","image_path","mobile_image_path",
                "text_align","text_color","starts_at","ends_at","status","enabled","sort_order"];
  const present = cols.filter((c) => c in patch);
  if (!present.length) return;
  const set = present.map((c) => `${c} = ?`);
  set.push(`updated_at = CURRENT_TIMESTAMP`);
  const params = present.map((c) => (patch as Record<string, unknown>)[c]);
  params.push(id);
  await sql.run(`UPDATE banners SET ${set.join(", ")} WHERE id = ?`, params);
}

export async function deleteBanner(id: number): Promise<void> {
  await sql.run("DELETE FROM banners WHERE id = ?", [id]);
}

export async function reorderBanners(orderedIds: number[]): Promise<void> {
  await sql.tx(async (t) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await t.run("UPDATE banners SET sort_order = ? WHERE id = ?", [
        (i + 1) * 10,
        orderedIds[i],
      ]);
    }
  });
}
