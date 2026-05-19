import "server-only";
import { sql } from "../db";

export type NoticeType = "scroll" | "popup" | "festive";

export type Notice = {
  id: number;
  type: NoticeType;
  body: string;
  link_href: string;
  link_text: string;
  color_bg: string;
  color_fg: string;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  dismissable: number;
  enabled: number;
  target_paths: string;
  created_at: string;
  updated_at: string;
};

export async function listNotices(opts?: { onlyLive?: boolean; type?: NoticeType }): Promise<Notice[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts?.type) { where.push("type = ?"); params.push(opts.type); }
  if (opts?.onlyLive) {
    where.push("enabled = 1");
    where.push("(starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)");
    where.push("(ends_at   IS NULL OR ends_at   >= CURRENT_TIMESTAMP)");
  }
  const query = `SELECT * FROM notices ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY priority DESC, id ASC`;
  return sql.all<Notice>(query, params);
}

export async function getNotice(id: number): Promise<Notice | null> {
  return sql.get<Notice>("SELECT * FROM notices WHERE id = ?", [id]);
}

export type NoticeInput = Omit<Notice, "id" | "created_at" | "updated_at">;

export async function createNotice(input: NoticeInput): Promise<number> {
  const r = await sql.run(
    `INSERT INTO notices
      (type, body, link_href, link_text, color_bg, color_fg, priority,
       starts_at, ends_at, dismissable, enabled, target_paths)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    [
      input.type,
      input.body,
      input.link_href,
      input.link_text,
      input.color_bg,
      input.color_fg,
      input.priority,
      input.starts_at,
      input.ends_at,
      input.dismissable,
      input.enabled,
      input.target_paths,
    ],
  );
  return Number(r.rows[0].id);
}

export async function updateNotice(id: number, patch: Partial<Notice>): Promise<void> {
  const cols = ["type","body","link_href","link_text","color_bg","color_fg","priority",
                "starts_at","ends_at","dismissable","enabled","target_paths"] as const;
  const present = cols.filter((c) => c in patch);
  if (!present.length) return;
  const set = present.map((c) => `${c} = ?`);
  const params = present.map((c) => (patch as Record<string, unknown>)[c]);
  set.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);
  await sql.run(`UPDATE notices SET ${set.join(", ")} WHERE id = ?`, params);
}

export async function deleteNotice(id: number): Promise<void> {
  await sql.run("DELETE FROM notices WHERE id = ?", [id]);
}
