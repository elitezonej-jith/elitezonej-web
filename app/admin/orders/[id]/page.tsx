import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, getOrderItems } from "../../../../lib/admin/repos/orders";
import PageHead from "../../components/PageHead";
import EditorsNote from "../../components/EditorsNote";
import StatusPill from "../../components/StatusPill";
import SectionRule from "../../components/SectionRule";
import OrderControls from "./OrderControls";
import { rupees, dateTime } from "../../../../lib/admin/format";
import { requireUser } from "../../../../lib/admin/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Params) {
  await requireUser();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const items = await getOrderItems(id);

  return (
    <div className="adm-page">
      <EditorsNote body={`Workbook entry ${order.id}, received ${dateTime(order.created_at)}.`} />

      <PageHead
        kicker={`Workbook · #${order.id}`}
        emphasis={order.customer}
        title=""
        stand={order.email}
      >
        <Link href="/admin/orders" className="adm-btn adm-btn--ghost">← All orders</Link>
        <StatusPill status={order.status} />
      </PageHead>

      <div className="adm-cols">
        <div className="adm-stack">
          <SectionRule kicker="Items" title="What's been ordered" />
          <div className="adm-panel adm-panel--ledger">
            <div className="adm-tbl-wrap">
              <table className="adm-tbl">
                <thead>
                  <tr>
                    <th>Piece</th>
                    <th>Variant</th>
                    <th className="adm-tbl__num">Qty</th>
                    <th className="adm-tbl__num">Unit</th>
                    <th className="adm-tbl__num">Line</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <Link href={`/admin/products/${it.product_slug}`} className="adm-tbl__name">
                          {it.product_name ?? it.product_slug}
                        </Link>
                        <span className="adm-tbl__sub">{it.product_slug}</span>
                      </td>
                      <td className="adm-mono">
                        {it.is_fabric ? `${it.colour ?? "—"}` : (it.size ?? "—")}
                        {it.is_fabric ? <span className="adm-tbl__sub">by metre</span> : null}
                      </td>
                      <td className="adm-tbl__num">{it.qty}</td>
                      <td className="adm-tbl__num">{rupees(it.unit_price)}</td>
                      <td className="adm-tbl__num adm-tbl__num--accent">{rupees(it.unit_price * it.qty)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="adm-tbl__num adm-mono" style={{ borderTop: "1px solid var(--adm-rule-strong)" }}>Subtotal</td>
                    <td className="adm-tbl__num" style={{ borderTop: "1px solid var(--adm-rule-strong)" }}>{rupees(order.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="adm-tbl__num adm-mono">Tax (18%)</td>
                    <td className="adm-tbl__num">{rupees(order.tax)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="adm-tbl__num adm-mono" style={{ fontWeight: 500, color: "var(--adm-ink)" }}>Total</td>
                    <td className="adm-tbl__num adm-tbl__num--accent" style={{ fontSize: 16 }}>{rupees(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="adm-stack">
          <SectionRule kicker="Status" title="Atelier flow" />
          <OrderControls id={order.id} status={order.status} notes={order.notes ?? ""} />

          <SectionRule kicker="Customer" title="On record" />
          <div className="adm-panel">
            <ul className="adm-bullets">
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Name</span> <span className="adm-italic">{order.customer}</span></li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Email</span> {order.email}</li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Phone</span> {order.phone ?? "—"}</li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>City</span> {order.city ?? "—"}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
