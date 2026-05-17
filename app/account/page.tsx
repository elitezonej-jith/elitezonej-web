import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { fmtINR } from "@/lib/format";
import { requireCustomer } from "../../lib/storefront/session";
import { getCustomerOrders } from "../../lib/admin/repos/customers";
import { signOutAction } from "./actions";
import ProfileForm from "./ProfileForm";
import "../styles/account.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account — Elite Zone J" };

export default async function AccountPage() {
  const me = await requireCustomer();
  const orders = getCustomerOrders(me.id);

  return (
    <>
      <Header />
      <main className="account-shell">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "clamp(28px,4vw,40px)", margin: "0 0 28px" }}>
          Hello, {me.first_name || "there"}
        </h1>

        <div className="account-grid">
          <section className="account-card">
            <h2>Profile</h2>
            <ProfileForm
              firstName={me.first_name}
              lastName={me.last_name}
              phone={me.phone ?? ""}
              city={me.city ?? ""}
            />
            <form action={signOutAction} style={{ marginTop: 18 }}>
              <button type="submit" className="btn btn-tertiary btn-block">Sign out</button>
            </form>
          </section>

          <section className="account-card">
            <h2>Order history</h2>
            {orders.length === 0 ? (
              <p style={{ color: "var(--ink-2)", fontSize: 14 }}>
                No orders yet.{" "}
                <Link href="/collection?c=men" style={{ color: "var(--ink)", textUnderlineOffset: 3 }}>
                  Start shopping
                </Link>
                .
              </p>
            ) : (
              <div>
                {orders.map((o) => (
                  <div key={o.id} className="order-row">
                    <span className="o-id">{o.id}</span>
                    <span className="o-status">{o.status}</span>
                    <span>{fmtINR(o.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
