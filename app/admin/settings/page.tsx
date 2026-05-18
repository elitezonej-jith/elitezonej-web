import { getSettings } from "../../../lib/admin/repos/settings";
import { listUsers } from "../../../lib/admin/repos/users";
import { listAudit } from "../../../lib/admin/repos/audit";
import { requireUser } from "../../../lib/admin/session";
import PageHead from "../components/PageHead";
import EditorsNote from "../components/EditorsNote";
import SectionRule from "../components/SectionRule";
import { dateTime } from "../../../lib/admin/format";
import SettingsForm from "./SettingsForm";
import PasswordForm from "./PasswordForm";
import InviteForm from "./InviteForm";
import UsersTable from "./UsersTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · Atelier" };

export default async function SettingsPage() {
  const me = await requireUser();
  const settings = getSettings();
  const users = listUsers();
  const log = listAudit(40);

  return (
    <div className="adm-page">
      <EditorsNote body={`Brand-wide preferences, your account, and the audit log. ${me.role === "owner" ? "As owner, you can also invite staff." : "Some controls are owner-only."}`} />
      <PageHead
        kicker="Workbook · 12"
        emphasis="Settings,"
        title="account, ledger"
        stand="Brand voice, currency, the people allowed in the workbook, and the trail of actions taken."
      />

      <SectionRule kicker="Brand" title="Atelier preferences" />
      <SettingsForm initial={settings} />

      <SectionRule kicker="Account" title="Your passphrase" />
      <PasswordForm />

      {me.role === "owner" && (
        <>
          <SectionRule kicker="Owner" title="Invite a staff member" />
          <InviteForm />
        </>
      )}

      {me.role === "owner" && (
        <>
          <SectionRule kicker="Roll" title="Operators on the workbook" />
          <UsersTable users={users} meId={me.id} canManage />
        </>
      )}

      <SectionRule kicker="Audit" title="The trail" />
      <div className="adm-panel adm-panel--ledger">
        <div className="adm-tbl-wrap">
          <table className="adm-tbl">
            <thead>
              <tr>
                <th>Time</th>
                <th>Operator</th>
                <th>Action</th>
                <th>Entity</th>
              </tr>
            </thead>
            <tbody>
              {log.map((l) => (
                <tr key={l.id}>
                  <td className="adm-mono">{dateTime(l.created_at)}</td>
                  <td className="adm-italic">{l.user_email ?? "system"}</td>
                  <td className="adm-mono">{l.action}</td>
                  <td className="adm-mono" style={{ color: "var(--adm-ink-3)" }}>{l.entity}{l.entity_id ? ` · ${l.entity_id}` : ""}</td>
                </tr>
              ))}
              {log.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 24 }}><span className="adm-italic">No actions yet.</span></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
