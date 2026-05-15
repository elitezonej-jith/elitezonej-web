"use client";
import Link from "next/link";
import { fmtINR, fmtMeters } from "@/lib/format";
import { WHATSAPP_LINK, WHATSAPP_DISPLAY } from "@/lib/contact";
import { useCart } from "../components/CartProvider";
import "../styles/cart.css";

export default function CheckoutClient() {
  const { items, subtotal, hydrated } = useCart();

  if (!hydrated) {
    return (
      <section className="cart-head">
        <h1>Checkout</h1>
        <span className="meta t-mono-xs">Loading…</span>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="cart-head">
        <h1>Checkout</h1>
        <div className="empty" style={{ marginTop: 24 }}>
          <p>Your bag is empty.</p>
          <Link className="btn btn-secondary" href="/collection?c=men">Shop the collection</Link>
        </div>
      </section>
    );
  }

  const orderLines = items
    .map((it) => {
      const qty = it.isFabric ? `${fmtMeters(it.qty)}` : `x${it.qty}`;
      const detail = [it.colour, it.size].filter(Boolean).join(" / ");
      return `• ${it.name}${detail ? ` (${detail})` : ""} ${qty} — ${fmtINR(it.unitPrice * it.qty)}`;
    })
    .join("\n");

  const message = encodeURIComponent(
    `Hello Elite Zone J, I'd like to place this order:\n\n${orderLines}\n\nSubtotal: ${fmtINR(subtotal)}\n\nPlease confirm availability and payment.`,
  );
  const waHref = `${WHATSAPP_LINK}?text=${message}`;

  return (
    <>
      <section className="cart-head">
        <h1>Checkout</h1>
        <span className="meta t-mono-xs">{fmtINR(subtotal)} · {items.length} line{items.length === 1 ? "" : "s"}</span>
      </section>

      <section className="cart-page-wrap">
        <div className="items">
          {items.map((it) => (
            <div key={it.id} className="item" style={{ minHeight: "auto" }}>
              <div className="info">
                <div className="top">
                  <h3 className="name">{it.name}</h3>
                  <span className="price">{fmtINR(it.unitPrice * it.qty)}</span>
                </div>
                <div className="specs t-mono-xs">
                  {it.colour && <><span>Colour · {it.colour}</span><span>·</span></>}
                  {it.size && <><span>Size · {it.size}</span><span>·</span></>}
                  <span>{it.isFabric ? `Length · ${fmtMeters(it.qty)}` : `Qty · ${it.qty}`}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="summary">
          <h2>Order summary</h2>
          <div className="row total"><span>Total</span><b>{fmtINR(subtotal)}</b></div>

          <p className="t-body-sm" style={{ margin: "16px 0", color: "var(--ink-2)" }}>
            Online card &amp; UPI payments are launching shortly. For now we confirm
            every order personally — send it to our atelier on WhatsApp and we&apos;ll
            reply with availability, fitting notes and a secure payment link.
          </p>

          <div className="ctas">
            <a className="btn btn-primary btn-lg btn-block" href={waHref} target="_blank" rel="noopener noreferrer">
              Place order via WhatsApp
            </a>
            <Link className="btn btn-secondary btn-block" href="/cart">Back to bag</Link>
          </div>

          <div className="reassure t-mono-xs">
            <span>✓ Personal order confirmation</span>
            <span>✓ Free alterations within 30 days</span>
            <span>✓ Reach us on {WHATSAPP_DISPLAY}</span>
          </div>
        </aside>
      </section>
    </>
  );
}
