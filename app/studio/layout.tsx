import type { ReactNode } from "react";
import { cookies } from "next/headers";
import StudioShell from "./components/StudioShell";
import { ToastProvider } from "./components/Toast";
import { SESSION_COOKIE, getSessionUser } from "../../lib/admin/auth";
import { countBookings } from "../../lib/admin/repos/bookings";
import { countOrders } from "../../lib/admin/repos/orders";
import { countProducts } from "../../lib/admin/repos/products";
import { listBanners } from "../../lib/admin/repos/banners";
import "./styles/studio.css";
import "react-image-crop/dist/ReactCrop.css";

export const metadata = {
  title: "Studio · Elite Zone J",
  description: "Manage your fashion brand — products, banners, offers, content.",
};

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const c = await cookies();
  const sid = c.get(SESSION_COOKIE)?.value;
  const me = sid ? getSessionUser(sid) : null;

  // Login + setup pages render bare (no shell). proxy.ts has already gated
  // unauthenticated visitors away from anything else.
  if (!me) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  const counts = {
    products: countProducts({ status: "all" }),
    bookingsNew: countBookings({ status: "new" }),
    ordersOpen: countOrders({ status: "new" }) + countOrders({ status: "confirmed" }) + countOrders({ status: "in_atelier" }),
    bannersDraft: listBanners().filter((b) => b.status !== "published" || b.enabled === 0).length,
  };

  return (
    <ToastProvider>
      <StudioShell user={me} counts={counts}>
        {children}
      </StudioShell>
    </ToastProvider>
  );
}
