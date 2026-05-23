import { redirect } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getCurrentCustomer } from "../../lib/storefront/session";
import { safeNextPath } from "../../lib/storefront/auth";
import LoginForm from "./LoginForm";
import "../styles/account.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in — Elite Zone J" };

export default async function LoginPage({
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
        <h1>Welcome back</h1>
        <p className="auth-sub">Sign in to your Elite Zone J account</p>
        <LoginForm next={safeNext} />
      </main>
      <Footer />
    </>
  );
}
