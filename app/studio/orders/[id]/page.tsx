import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, getOrderItems } from "../../../../lib/admin/repos/orders";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import OrderControls from "./OrderControls";
import { rupees, dateTime } from "../../../../lib/admin/format";
import { requireUser } from "../../../../lib/admin/session";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Params) {
  await requireUser("/studio/login");
  const { id } = await params;
  const order = getOrder(id);
  if (!order) notFound();
  const items = getOrderItems(id);
  return (
    <div className="stu-page">
      <PageHead title={`Order #${order.id}`} sub={`${order.customer} · ${dateTime(order.created_at)}`}
                back={{ href: "/studio/orders", label: "Back to orders" }}>
        <StatusTag status={order.status} />
      </PageHead>
      <div className="stu-cols">
        <div className="stu-stack">
          <section className="stu-card">
            <header className="stu-card__head"><h3>Items</h3></header>
            <div className="stu-card__body--flush">
              <div className="stu-tbl-wrap">
                <table className="stu-tbl">
                  <thead><tr><th>Product</th><th>Variant</th><th className="stu-tbl__num">Qty</th><th className="stu-tbl__num">Unit</th><th className="stu-tbl__num">Line</th></tr></thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td>
                          <Link href={`/studio/products/${it.product_slug}`} className="stu-tbl__name">{it.product_name ?? it.product_slug}</Link>
                          <span className="stu-tbl__sub">{it.product_slug}</span>
                        </td>
                        <td>{it.is_fabric ? `${it.colour ?? "—"} (metres)` : (it.size ?? "—")}</td>
                        <td className="stu-tbl__num">{it.qty}</td>
                        <td className="stu-tbl__num">{rupees(it.unit_price)}</td>
                        <td className="stu-tbl__num">{rupees(it.unit_price * it.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr><td colSpan={4} className="stu-tbl__num">Subtotal</td><td className="stu-tbl__num">{rupees(order.subtotal)}</td></tr>
                    <tr><td colSpan={4} className="stu-tbl__num">Tax (18%)</td><td className="stu-tbl__num">{rupees(order.tax)}</td></tr>
                    <tr><td colSpan={4} className="stu-tbl__num" style={{ fontWeight: 700 }}>Total</td><td className="stu-tbl__num" style={{ fontWeight: 700 }}>{rupees(order.total)}</td></tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </section>
        </div>
        <div className="stu-stack">
          <OrderControls id={order.id} status={order.status} notes={order.notes ?? ""} />
          <section className="stu-card">
            <header className="stu-card__head"><h3>Customer</h3></header>
            <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <strong>{order.customer}</strong>
              <span style={{ color: "var(--stu-text-3)" }}>{order.email}</span>
              <span style={{ color: "var(--stu-text-3)" }}>{order.phone ?? "—"} · {order.city ?? "—"}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
