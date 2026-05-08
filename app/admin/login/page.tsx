import { redirect } from "next/navigation";
import { countUsers } from "../../../lib/admin/repos/users";
import { getCurrentUser } from "../../../lib/admin/session";
import LoginForm from "./LoginForm";
import "../styles/admin.css";

export const metadata = { title: "Sign in · Elite Zone J Atelier" };

type SP = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: SP) {
  if (countUsers() === 0) redirect("/admin/setup");
  const me = await getCurrentUser();
  if (me) redirect("/admin");
  const sp = await searchParams;

  return (
    <main className="adm-auth">
      <div className="adm-auth-stage">
        <header className="adm-auth-mark">
          <span className="adm-auth-mark__sigil">EZJ</span>
          <span className="adm-auth-mark__line">Atelier · Operations</span>
        </header>
        <h1 className="adm-auth-title">
          <em>Sign in</em>
          <span>to the workbook</span>
        </h1>
        <p className="adm-auth-stand">
          For appointed operators only. Each entry is logged in the ledger.
        </p>
        <div className="adm-auth-rule" aria-hidden="true" />
        <LoginForm next={sp.next ?? "/admin"} />
      </div>
      <aside className="adm-auth-side" aria-hidden="true">
        <div className="adm-auth-side__inner">
          <span className="adm-auth-side__kicker">Folio · 01</span>
          <p className="adm-auth-side__quote">
            “Cut to fit. <em>Built to last.</em>”
          </p>
          <span className="adm-auth-side__caption">Atelier credo</span>
        </div>
      </aside>
    </main>
  );
}
