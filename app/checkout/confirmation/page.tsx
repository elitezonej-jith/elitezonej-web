import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, getOrderItems } from "../../../lib/admin/repos/orders";
import { fmtINR } from "@/lib/format";
import "../../styles/cart.css";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ o?: string }> };

export default async function ConfirmationPage({ searchParams }: Props) {
  const { o } = await searchParams;
  if (!o) notFound();
  const order = getOrder(o);
  if (!order) notFound();
  const items = getOrderItems(o);

  const paid = order.payment_status === "paid";

  return (
    <>
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
            <Link className="btn btn-primary btn-block" href="/collection?c=men">Continue shopping</Link>
          </div>
        </aside>
      </section>
    </>
  );
}
