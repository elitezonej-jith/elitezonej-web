import { notFound } from "next/navigation";
import { getOrder, getOrderItems } from "../../../../../lib/admin/repos/orders";
import { requireUser } from "../../../../../lib/admin/session";
import { rupees, dateTime } from "../../../../../lib/admin/format";
import InvoiceActions from "./InvoiceActions";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function InvoicePage({ params }: Params) {
  await requireUser("/studio/login");
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const items = await getOrderItems(id);

  return (
    <div className="inv-page">
      <InvoiceActions orderId={order.id} />
      <div className="inv-doc">
        {/* Header */}
        <div className="inv-doc__header">
          <div className="inv-doc__brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/wordmark-trimmed.png" alt="Elite Zone J" className="inv-doc__logo" />
            <p className="inv-doc__tagline">Premium Tailoring · India</p>
          </div>
          <div className="inv-doc__meta">
            <h2 className="inv-doc__title">INVOICE</h2>
            <table className="inv-doc__meta-tbl">
              <tbody>
                <tr><td>Invoice #</td><td><strong>{order.id}</strong></td></tr>
                <tr><td>Date</td><td>{dateTime(order.created_at)}</td></tr>
                <tr><td>Payment</td><td><strong className={order.payment_status === "paid" ? "inv-doc__paid" : "inv-doc__pending"}>{order.payment_status === "paid" ? "PAID" : "PENDING"}</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill to */}
        <div className="inv-doc__billing">
          <h3>Bill to</h3>
          <p className="inv-doc__name">{order.ship_name || order.customer}</p>
          <p>{order.ship_line1}</p>
          {order.ship_line2 && <p>{order.ship_line2}</p>}
          <p>{order.ship_city}, {order.ship_state} {order.ship_pincode}</p>
          <p>Phone: {order.phone || "—"}</p>
          <p>Email: {order.email}</p>
        </div>

        {/* Items table */}
        <table className="inv-doc__table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Variant</th>
              <th className="inv-doc__num">Qty</th>
              <th className="inv-doc__num">Rate</th>
              <th className="inv-doc__num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.product_name ?? (it.product_slug.startsWith("custom:") ? it.product_slug.slice(7) : it.product_slug)}</td>
                <td>{it.size || it.colour || "—"}</td>
                <td className="inv-doc__num">{it.qty}</td>
                <td className="inv-doc__num">{rupees(it.unit_price)}</td>
                <td className="inv-doc__num">{rupees(it.unit_price * it.qty)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={4}>Subtotal</td><td className="inv-doc__num">{rupees(order.subtotal)}</td></tr>
            {order.discount > 0 && <tr><td colSpan={4}>Discount{order.promo_code ? ` (${order.promo_code})` : ""}</td><td className="inv-doc__num">−{rupees(order.discount)}</td></tr>}
            <tr><td colSpan={4}>Shipping</td><td className="inv-doc__num">{order.shipping > 0 ? rupees(order.shipping) : "FREE"}</td></tr>
            {order.tax > 0 && <tr><td colSpan={4}>Tax (GST)</td><td className="inv-doc__num">{rupees(order.tax)}</td></tr>}
            <tr className="inv-doc__total"><td colSpan={4}>Total</td><td className="inv-doc__num">{rupees(order.total)}</td></tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div className="inv-doc__footer">
          <p>Thank you for choosing Elite Zone J.</p>
          <p>Questions? WhatsApp: +91 89398 88593 · hello@elitezonej.com</p>
        </div>
      </div>
    </div>
  );
}
