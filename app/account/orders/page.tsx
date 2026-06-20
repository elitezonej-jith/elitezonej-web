import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { fmtINR } from "@/lib/format";
import { requireCustomer } from "../../../lib/storefront/session";
import { getCustomerOrdersByEmail } from "../../../lib/admin/repos/customers";
import "../../styles/account.css";
import "../../styles/orders.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your orders — Elite Zone J" };

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

export default async function OrdersPage() {
  const me = await requireCustomer();
  const orders = await getCustomerOrdersByEmail(me.email);

  return (
    <>
      <Header />
      <main className="account-shell">
        <div className="orders-head">
          <h1>Your orders</h1>
          <Link href="/account" className="orders-back">← Account</Link>
        </div>

        {orders.length === 0 ? (
          <p className="orders-empty">
            No orders yet.{" "}
            <Link href="/collection?c=men">Start shopping</Link>.
          </p>
        ) : (
          <div className="orders-list">
            {orders.map((o) => (
              <Link key={o.id} href={`/account/orders/${o.id}`} className="orders-card">
                <span className="orders-card-id">{o.id}</span>
                <span className="orders-card-date">{orderDate(o.created_at)}</span>
                <span className="orders-card-status">{statusLabel(o.status)}</span>
                <span className="orders-card-total">{fmtINR(o.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
