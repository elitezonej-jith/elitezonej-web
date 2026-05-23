import { redirect } from "next/navigation";
import { countUsers } from "../../../lib/admin/repos/users";
import { cookies } from "next/headers";
import { SESSION_COOKIE, getSessionUser } from "../../../lib/admin/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in · Studio" };

type SP = { searchParams: Promise<{ next?: string }> };

export default async function StudioLoginPage({ searchParams }: SP) {
  if ((await countUsers()) === 0) redirect("/studio/setup");
  const c = await cookies();
  const me = await getSessionUser(c.get(SESSION_COOKIE)?.value);
  if (me) redirect("/studio");
  const sp = await searchParams;
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
        <h1 className="stu-auth-card__title">Welcome back</h1>
        <p className="stu-auth-card__sub">Sign in to manage your storefront.</p>
        <LoginForm next={sp.next ?? "/studio"} />
      </div>
    </main>
  );
}
