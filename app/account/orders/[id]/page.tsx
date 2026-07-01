import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { fmtINR } from "@/lib/format";
import { requireCustomer } from "../../../../lib/storefront/session";
import { getOrder, getOrderItems } from "../../../../lib/admin/repos/orders";
import "../../../styles/orders.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Order ${id} — Elite Zone J` };
}

const STATUS_STEPS = ["confirmed", "in_atelier", "shipped", "fulfilled"] as const;
const STATUS_LABELS: Record<string, string> = {
  new: "Order placed",
  confirmed: "Confirmed",
  in_atelier: "In production",
  shipped: "Shipped",
  fulfilled: "Delivered",
  cancelled: "Cancelled",
};

function statusLabel(s: string): string {
  return STATUS_LABELS[s] ?? s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireCustomer();
  const order = await getOrder(id);
  if (!order || order.customer_id !== me.id) notFound();

  const items = await getOrderItems(id);
  const isCancelled = order.status === "cancelled";
  const currentStepIdx = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);

  return (
    <>
      <Header />
      <main className="account-shell">
        <div className="orders-head">
          <h1>Order {order.id}</h1>
          <div className="orders-head__actions">
            <Link href={`/account/orders/${order.id}/invoice`} className="orders-invoice-btn">Download Invoice</Link>
            <Link href="/account/orders" className="orders-back">← All orders</Link>
          </div>
        </div>

        <div className="od-meta">
          <span>Placed {fmtDate(order.created_at)}</span>
          <span className="od-status">{statusLabel(order.status)}</span>
        </div>

        {/* Progress timeline — only for non-cancelled orders that are past 'new' */}
        {!isCancelled && order.status !== "new" && (
          <section className="od-timeline">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStepIdx;
              const active = i === currentStepIdx;
              return (
                <div key={step} className={`od-step${done ? " od-step--done" : ""}${active ? " od-step--active" : ""}`}>
                  <div className="od-step__dot" />
                  <span className="od-step__label">{STATUS_LABELS[step]}</span>
                </div>
              );
            })}
          </section>
        )}

        {/* Tracking info — visible when shipped or delivered */}
        {order.courier_name && order.tracking_number && (
          <section className="od-tracking">
            <h3>Shipment tracking</h3>
            <div className="od-tracking__details">
              <span><strong>{order.courier_name}</strong></span>
              <span className="od-tracking__awb">AWB: {order.tracking_number}</span>
              {order.shipped_at && <span className="od-tracking__date">Shipped {fmtDate(order.shipped_at)}</span>}
              {order.delivered_at && <span className="od-tracking__date">Delivered {fmtDate(order.delivered_at)}</span>}
            </div>
            {order.tracking_url && (
              <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="od-tracking__btn">
                Track package ↗
              </a>
            )}
          </section>
        )}

        <section className="od-items">
          {items.map((it) => (
            <div key={it.id} className="od-item">
              <div className="od-item-name">{it.product_name || it.product_slug}</div>
              <div className="od-item-specs">
                {it.colour && <span>Colour: {it.colour}</span>}
                {it.size && <span>Size: {it.size}</span>}
                <span>{it.is_fabric ? `Length: ${it.qty}m` : `Qty: ${it.qty}`}</span>
              </div>
              <div className="od-item-price">{fmtINR(it.unit_price * it.qty)}</div>
            </div>
          ))}
        </section>

        <section className="od-summary">
          <div className="od-row"><span>Subtotal</span><span>{fmtINR(order.subtotal)}</span></div>
          {order.discount > 0 && (
            <div className="od-row"><span>Discount{order.promo_code ? ` (${order.promo_code})` : ""}</span><span>−{fmtINR(order.discount)}</span></div>
          )}
          <div className="od-row"><span>Shipping</span><span>{order.shipping > 0 ? fmtINR(order.shipping) : "Free"}</span></div>
          {order.tax > 0 && <div className="od-row"><span>Tax</span><span>{fmtINR(order.tax)}</span></div>}
          <div className="od-row od-total"><span>Total</span><b>{fmtINR(order.total)}</b></div>
        </section>

        <section className="od-shipping">
          <h3>Shipping address</h3>
          <p>
            {order.ship_name}<br />
            {order.ship_line1}{order.ship_line2 ? `, ${order.ship_line2}` : ""}<br />
            {order.ship_city}, {order.ship_state} {order.ship_pincode}
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
