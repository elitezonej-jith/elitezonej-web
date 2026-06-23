import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { fmtINR } from "@/lib/format";
import { requireCustomer } from "../../lib/storefront/session";
import { getCustomerOrdersByEmail } from "../../lib/admin/repos/customers";
import { listAddressesForCustomer } from "../../lib/admin/repos/addresses";
import AccountClient from "./AccountClient";
import "../styles/account.css";
import "../styles/addresses.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account — Elite Zone J" };

export default async function AccountPage() {
  const me = await requireCustomer();
  const orders = await getCustomerOrdersByEmail(me.email);
  const addresses = await listAddressesForCustomer(me.id);

  return (
    <>
      <Header />
      <main className="account-shell">
        <AccountClient
          customer={{ firstName: me.first_name, lastName: me.last_name, email: me.email, phone: me.phone ?? "", city: me.city ?? "" }}
          orders={orders.map(o => ({ id: o.id, status: o.status, total: o.total, created_at: o.created_at }))}
          addresses={addresses}
        />
      </main>
      <Footer />
    </>
  );
}
