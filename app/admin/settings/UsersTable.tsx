"use client";
import { useState } from "react";
import { deleteUserAction } from "../actions/auth";
import StatusPill from "../components/StatusPill";
import DeedOfAction from "../components/DeedOfAction";
import { dateShort } from "../../../lib/admin/format";
import type { User } from "../../../lib/admin/types";

export default function UsersTable({ users, meId, canManage }: { users: User[]; meId: number; canManage: boolean }) {
  const [target, setTarget] = useState<User | null>(null);
  return (
    <div className="adm-panel adm-panel--ledger">
      <div className="adm-tbl-wrap">
        <table className="adm-tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last seen</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="adm-tbl__name" style={{ fontStyle: "italic" }}>{u.name}{u.id === meId ? " · you" : ""}</td>
                <td className="adm-mono">{u.email}</td>
                <td>
                  <StatusPill status="info" label={u.role.toUpperCase()} variant={u.role === "owner" ? "accent" : "info"} />
                </td>
                <td className="adm-mono">{u.last_login_at ? dateShort(u.last_login_at) : "—"}</td>
                <td className="adm-mono">{dateShort(u.created_at)}</td>
                <td>
                  {canManage && u.id !== meId && (
                    <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => setTarget(u)}>Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeedOfAction
        open={!!target}
        onClose={() => setTarget(null)}
        title={`You are about to remove ${target?.name?.toUpperCase()}.`}
        body="This action cannot be undone. The operator will lose access to the workbook immediately."
        confirmLabel="Yes, remove"
        formAction={async (fd) => { await deleteUserAction(fd); }}
        hidden={target ? { id: String(target.id) } : undefined}
      />
    </div>
  );
}
