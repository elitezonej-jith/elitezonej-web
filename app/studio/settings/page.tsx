import { getSettings } from "../../../lib/admin/repos/settings";
import { listUsers } from "../../../lib/admin/repos/users";
import { listAudit } from "../../../lib/admin/repos/audit";
import { requireUser } from "../../../lib/admin/session";
import PageHead from "../components/PageHead";
import StatusTag from "../components/StatusTag";
import SettingsForm from "./SettingsForm";
import PasswordForm from "./PasswordForm";
import InviteForm from "./InviteForm";
import { dateTime } from "../../../lib/admin/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · Studio" };

export default async function SettingsPage() {
  const me = await requireUser();
  const settings = await getSettings();
  const users = await listUsers();
  const log = await listAudit(40);
  return (
    <div className="stu-page">
      <PageHead title="Settings" sub="Brand details, your account, and team access." />
      <div className="stu-cols">
        <div className="stu-stack">
          <section className="stu-card">
            <header className="stu-card__head"><h3>Brand</h3></header>
            <div className="stu-card__body"><SettingsForm initial={settings} /></div>
          </section>
          <section className="stu-card">
            <header className="stu-card__head"><h3>Your password</h3></header>
            <div className="stu-card__body"><PasswordForm /></div>
          </section>
          {me.role === "owner" && (
            <section className="stu-card">
              <header className="stu-card__head"><h3>Invite a teammate</h3></header>
              <div className="stu-card__body"><InviteForm /></div>
            </section>
          )}
        </div>
        <div className="stu-stack">
          {me.role === "owner" && (
            <section className="stu-card">
              <header className="stu-card__head"><h3>Team</h3></header>
              <div className="stu-card__body--flush">
                <div className="stu-tbl-wrap">
                  <table className="stu-tbl">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td><strong>{u.name}</strong>{u.id === me.id ? " · you" : ""}</td>
                          <td>{u.email}</td>
                          <td><StatusTag tone={u.role === "owner" ? "brand" : "info"} label={u.role.toUpperCase()} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
          <section className="stu-card">
            <header className="stu-card__head"><h3>Activity log</h3></header>
            <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflow: "auto" }}>
              {log.length === 0 ? <span style={{ color: "var(--stu-text-3)", fontSize: 13 }}>No activity yet.</span> : log.map((l) => (
                <div key={l.id} style={{ fontSize: 13 }}>
                  <strong>{l.user_email ?? "system"}</strong> · <span style={{ color: "var(--stu-text-3)" }}>{l.action}</span>
                  <span style={{ color: "var(--stu-text-3)", fontSize: 12, display: "block" }}>{dateTime(l.created_at)} · {l.entity}{l.entity_id ? ` #${l.entity_id}` : ""}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
