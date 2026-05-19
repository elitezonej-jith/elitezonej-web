import { notFound } from "next/navigation";
import { countUsers } from "../../../lib/admin/repos/users";
import SetupForm from "./SetupForm";

export const metadata = { title: "Get started · Studio" };

export default async function StudioSetupPage() {
  if ((await countUsers()) > 0) notFound();
  return (
    <main className="stu-auth stu">
      <div className="stu-auth-card">
        <div className="stu-auth-card__brand">
          <span className="stu-auth-card__brand__mark">EZJ</span>
          <span>
            <span className="stu-auth-card__brand__name">Elite Zone J</span>
            <span className="stu-auth-card__brand__sub">Studio</span>
          </span>
        </div>
        <h1 className="stu-auth-card__title">Welcome — let's set you up</h1>
        <p className="stu-auth-card__sub">Create the owner account. You can invite teammates later.</p>
        <SetupForm />
      </div>
    </main>
  );
}
