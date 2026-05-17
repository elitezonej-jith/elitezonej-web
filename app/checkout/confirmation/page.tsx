import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, getOrderItems } from "../../../lib/admin/repos/orders";
import { saveAddressFromOrder } from "../../../lib/admin/repos/addresses";
import { verifyOrderToken } from "../../../lib/storefront/checkout-token";
import { getCurrentCustomer } from "../../../lib/storefront/session";
import { fmtINR } from "@/lib/format";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "../../styles/cart.css";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ o?: string; t?: string }> };

export default async function ConfirmationPage({ searchParams }: Props) {
  const { o, t } = await searchParams;
  if (!o) notFound();
  const order = getOrder(o);
  if (!order) notFound();

  // Access control (closes the ?o= IDOR PII leak): either a valid short-lived
  // checkout token from the browser that placed this order, or an
  // authenticated customer who owns it.
  const customer = await getCurrentCustomer();
  const tokenOk = verifyOrderToken(o, t);
  const ownerOk = !!customer && order.customer_id === customer.id;
  if (!tokenOk && !ownerOk) notFound();

  const items = getOrderItems(o);

  const paid = order.payment_status === "paid";

  // Save the used shipping address to the customer's book, de-duplicated.
  // Only for the authenticated owner of a paid order — guests save nothing.
  // Best-effort: the order is already settled, so a failure here must never
  // surface to the customer.
  if (paid && customer && ownerOk) {
    try {
      const [firstName, ...rest] = (order.ship_name || "").trim().split(/\s+/);
      saveAddressFromOrder(customer.id, {
        first_name: firstName ?? "",
        last_name: rest.join(" "),
        line1: order.ship_line1,
        line2: order.ship_line2,
        city: order.ship_city,
        state: order.ship_state,
        pincode: order.ship_pincode,
        country: order.ship_country || "India",
      });
    } catch {
      /* non-critical: order is paid; address-book save is opportunistic */
    }
  }

  return (
    <>
      <Header />
      <main>
      <section className="cart-head">
        <h1>{paid ? "Order confirmed" : "Order received"}</h1>
        <span className="meta t-mono-xs">Reference {order.id}</span>
      </section>

      <section className="cart-page-wrap">
        <div className="items">
          {items.map((it) => (
            <div key={it.id} className="item" style={{ minHeight: "auto" }}>
              <div className="info">
                <div className="top">
                  <h3 className="name">{it.product_name || it.product_slug}</h3>
                  <span className="price">{fmtINR(it.unit_price * it.qty)}</span>
                </div>
                <div className="specs t-mono-xs">
                  {it.colour && <><span>Colour · {it.colour}</span><span>·</span></>}
                  {it.size && <><span>Size · {it.size}</span><span>·</span></>}
                  <span>{it.is_fabric ? `Length · ${it.qty}m` : `Qty · ${it.qty}`}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="summary">
          <h2>Summary</h2>
          <div className="row"><span>Subtotal</span><span>{fmtINR(order.subtotal)}</span></div>
          {order.discount > 0 && (
            <div className="row"><span>Discount{order.promo_code ? ` (${order.promo_code})` : ""}</span><span>−{fmtINR(order.discount)}</span></div>
          )}
          <div className="row"><span>Shipping</span><span>{order.shipping > 0 ? fmtINR(order.shipping) : "Free"}</span></div>
          {order.tax > 0 && <div className="row"><span>Tax</span><span>{fmtINR(order.tax)}</span></div>}
          <div className="row total"><span>Total</span><b>{fmtINR(order.total)}</b></div>

          <p className="t-body-sm" style={{ margin: "16px 0", color: "var(--ink-2)" }}>
            {paid
              ? `Thank you, ${order.ship_name || "—"}. A confirmation has been noted for ${order.email}. We’ll be in touch with fitting and dispatch details.`
              : "Your order is saved and awaiting payment confirmation. Our atelier will reach out shortly."}
          </p>

          <div className="ctas">
            <Link className="btn btn-primary btn-block" href="/account">View your orders</Link>
            <Link className="btn btn-secondary btn-block" href="/collection?c=men" style={{ marginTop: "8px" }}>Continue shopping</Link>
          </div>
        </aside>
      </section>
      </main>
      <Footer />
    </>
  );
}
