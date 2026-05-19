import "server-only";
import { sql } from "../db";
import type { AuditLog } from "../types";

export async function logAudit(entry: {
  user_id: number | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  payload?: unknown;
}): Promise<void> {
  await sql.run(
    `INSERT INTO audit_log (user_id, action, entity, entity_id, payload_json) VALUES (?, ?, ?, ?, ?)`,
    [
      entry.user_id,
      entry.action,
      entry.entity,
      entry.entity_id ?? null,
      entry.payload === undefined ? null : JSON.stringify(entry.payload),
    ],
  );
}

export async function listAudit(
  limit = 100,
): Promise<Array<AuditLog & { user_email: string | null }>> {
  return sql.all<AuditLog & { user_email: string | null }>(
    `SELECT a.*, u.email as user_email
       FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC LIMIT ?`,
    [limit],
  );
}
