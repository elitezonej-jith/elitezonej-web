import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { fmtINR } from "@/lib/format";
import { requireCustomer } from "../../lib/storefront/session";
import { getCustomerOrdersByEmail } from "../../lib/admin/repos/customers";
import { listAddressesForCustomer } from "../../lib/admin/repos/addresses";
import { signOutAction } from "./actions";
import ProfileForm from "./ProfileForm";
import AddressBook from "./AddressBook";
import "../styles/account.css";
import "../styles/addresses.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account — Elite Zone J" };

// Accurate, customer-facing label — never fabricate "paid"/"confirmed" for an
// order still awaiting payment (status starts 'new' until payment completes).
function statusLabel(status: string): string {
  if (status === "new") return "Awaiting payment";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function orderDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AccountPage() {
  const me = await requireCustomer();
  // me.email is the verified server-side session email (never client input).
  const orders = getCustomerOrdersByEmail(me.email);
  // Addresses are scoped to the server-resolved account id, never client input.
  const addresses = listAddressesForCustomer(me.id);

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
                    <span className="o-status">{statusLabel(o.status)}</span>
                    <span style={{ color: "var(--ink-2)", fontSize: 13 }}>{orderDate(o.created_at)}</span>
                    <span>{fmtINR(o.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="account-card">
            <h2>Saved addresses</h2>
            <AddressBook addresses={addresses} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
