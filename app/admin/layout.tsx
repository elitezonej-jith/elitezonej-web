import type { ReactNode } from "react";
import { cookies } from "next/headers";
import AdminSidebar from "./components/AdminSidebar";
import AdminTopbar from "./components/AdminTopbar";
import FlashToast from "./components/FlashToast";
import { SESSION_COOKIE, getSessionUser } from "../../lib/admin/auth";
import { countBookings } from "../../lib/admin/repos/bookings";
import { countOrders } from "../../lib/admin/repos/orders";
import { countProducts } from "../../lib/admin/repos/products";
import "./styles/admin.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Atelier Operations · Elite Zone J",
  description: "Operator workbook for the Elite Zone J atelier.",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const c = await cookies();
  const sid = c.get(SESSION_COOKIE)?.value;
  const me = sid ? await getSessionUser(sid) : null;

  // No (or invalid) session — render the page without the workbook shell.
  // proxy.ts has already gated unauthenticated visitors away from protected
  // routes, so here we are necessarily on /admin/login or /admin/setup.
  if (!me) {
    return <div className="adm-auth-root">{children}</div>;
  }

  const counts = {
    products: await countProducts({ kind: "tailored", status: "all" }),
    fabrics: await countProducts({ kind: "fabric", status: "all" }),
    bookingsNew: await countBookings({ status: "new" }),
    orders: await countOrders(),
  };

  return (
    <div className="adm-shell">
      <AdminSidebar user={me} counts={counts} />
      <main className="adm-canvas">
        <AdminTopbar user={me} />
        <FlashToast />
        {children}
      </main>
    </div>
  );
}

