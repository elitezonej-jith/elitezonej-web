import "server-only";
import { getDb } from "../db";

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

export function listNotices(opts?: { onlyLive?: boolean; type?: NoticeType }): Notice[] {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts?.type) { where.push("type = ?"); params.push(opts.type); }
  if (opts?.onlyLive) {
    where.push("enabled = 1");
    where.push("(starts_at IS NULL OR datetime(starts_at) <= datetime('now'))");
    where.push("(ends_at   IS NULL OR datetime(ends_at)   >= datetime('now'))");
  }
  const sql = `SELECT * FROM notices ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY priority DESC, id ASC`;
  return db.prepare(sql).all(...params) as Notice[];
}

export function getNotice(id: number): Notice | null {
  return (getDb().prepare("SELECT * FROM notices WHERE id = ?").get(id) as Notice | undefined) ?? null;
}

export type NoticeInput = Omit<Notice, "id" | "created_at" | "updated_at">;

export function createNotice(input: NoticeInput): number {
  const r = getDb().prepare(`
    INSERT INTO notices
      (type, body, link_href, link_text, color_bg, color_fg, priority,
       starts_at, ends_at, dismissable, enabled, target_paths)
    VALUES
      (@type, @body, @link_href, @link_text, @color_bg, @color_fg, @priority,
       @starts_at, @ends_at, @dismissable, @enabled, @target_paths)
  `).run(input);
  return Number(r.lastInsertRowid);
}

export function updateNotice(id: number, patch: Partial<Notice>): void {
  const cols = ["type","body","link_href","link_text","color_bg","color_fg","priority",
                "starts_at","ends_at","dismissable","enabled","target_paths"];
  const set = cols.filter((c) => c in patch).map((c) => `${c} = @${c}`);
  if (!set.length) return;
  set.push(`updated_at = datetime('now')`);
  getDb().prepare(`UPDATE notices SET ${set.join(", ")} WHERE id = @id`).run({ id, ...patch });
}

export function deleteNotice(id: number): void {
  getDb().prepare("DELETE FROM notices WHERE id = ?").run(id);
}
