import "server-only";
import { getDb } from "../db";
import type { AuditLog } from "../types";

export function logAudit(entry: {
  user_id: number | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  payload?: unknown;
}): void {
  getDb()
    .prepare(
      `INSERT INTO audit_log (user_id, action, entity, entity_id, payload_json) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      entry.user_id,
      entry.action,
      entry.entity,
      entry.entity_id ?? null,
      entry.payload === undefined ? null : JSON.stringify(entry.payload),
    );
}

export function listAudit(limit = 100): Array<AuditLog & { user_email: string | null }> {
  return getDb()
    .prepare(
      `SELECT a.*, u.email as user_email
       FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
       ORDER BY datetime(a.created_at) DESC LIMIT ?`,
    )
    .all(limit) as Array<AuditLog & { user_email: string | null }>;
}
