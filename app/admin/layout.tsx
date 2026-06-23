import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

  // Staff users cannot access the admin panel — redirect to Studio.
  if (me.role !== "owner") {
    redirect("/studio");
  }

  const [products, fabrics, bookingsNew, orders] = await Promise.all([
    countProducts({ kind: "tailored", status: "all" }),
    countProducts({ kind: "fabric", status: "all" }),
    countBookings({ status: "new" }),
    countOrders(),
  ]);
  const counts = { products, fabrics, bookingsNew, orders };

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

