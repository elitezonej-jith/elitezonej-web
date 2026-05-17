import { redirect } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getCurrentCustomer } from "../../lib/storefront/session";
import { safeNextPath } from "../../lib/storefront/auth";
import SignupForm from "./SignupForm";
import "../styles/account.css";

// No `force-dynamic`: the page reads cookies() via getCurrentCustomer(), which
// already opts it into dynamic (per-request) rendering (Next 16 cookies.md:69),
// so the signed-in→/account redirect stays per-request correct. Dropping the
// blanket opt-out lets the static shell become prefetchable / client-cacheable.
export const metadata = { title: "Create account — Elite Zone J" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next ? safeNextPath(next) : undefined;
  if (await getCurrentCustomer()) redirect(safeNext ?? "/account");

  return (
    <>
      <Header />
      <main className="auth-wrap">
        <h1>Create your account</h1>
        <p className="auth-sub">Track orders and check out faster</p>
        <SignupForm next={safeNext} />
      </main>
      <Footer />
    </>
  );
}
