import { notFound } from "next/navigation";
import { countUsers } from "../../../lib/admin/repos/users";
import SetupForm from "./SetupForm";
import "../styles/admin.css";

export const metadata = { title: "First-run setup · Elite Zone J Atelier" };

export default async function SetupPage() {
  if ((await countUsers()) > 0) notFound();
  return (
    <main className="adm-auth">
      <div className="adm-auth-stage">
        <header className="adm-auth-mark">
          <span className="adm-auth-mark__sigil">EZJ</span>
          <span className="adm-auth-mark__line">Atelier · Operations</span>
        </header>
        <h1 className="adm-auth-title">
          <em>Inscribe</em>
          <span>the first operator</span>
        </h1>
        <p className="adm-auth-stand">
          The workbook has no entries yet. Open it with the atelier-owner
          account. You can invite staff once you are inside.
        </p>
        <div className="adm-auth-rule" aria-hidden="true" />
        <SetupForm />
      </div>
      <aside className="adm-auth-side" aria-hidden="true">
        <div className="adm-auth-side__inner">
          <span className="adm-auth-side__kicker">Folio · 01</span>
          <p className="adm-auth-side__quote">
            <em>“Begin a new entry.”</em>
          </p>
          <span className="adm-auth-side__caption">Workbook, page one</span>
        </div>
      </aside>
    </main>
  );
}
