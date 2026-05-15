"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fmtINR, fmtMeters } from "@/lib/format";
import { WHATSAPP_LINK, WHATSAPP_DISPLAY } from "@/lib/contact";
import { useCart } from "../components/CartProvider";
import { startCheckout, confirmPayment, type CheckoutStartState } from "./actions";
import "../styles/cart.css";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RZP_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = RZP_SRC;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const initial: CheckoutStartState = {};

export default function CheckoutClient() {
  const { items, subtotal, hydrated, clear } = useCart();
  const router = useRouter();
  const [state, action, pending] = useActionState(startCheckout, initial);
  const [phase, setPhase] = useState<"form" | "paying" | "error">("form");
  const [payError, setPayError] = useState<string | null>(null);
  const launched = useRef(false);

  // When the server has created an order + Razorpay order, open the gateway.
  useEffect(() => {
    if (!state.ok || launched.current) return;
    if (state.provider !== "razorpay" || !state.razorpay) return;
    launched.current = true;
    setPhase("paying");

    (async () => {
      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) {
        setPayError("Could not load the payment window. Please retry.");
        setPhase("error");
        return;
      }
      const rzp = new window.Razorpay({
        key: state.razorpay!.keyId,
        order_id: state.razorpay!.providerOrderId,
        amount: (state.amount ?? 0) * 100,
        currency: "INR",
        name: "Elite Zone J",
        description: `Order ${state.orderId}`,
        handler: async (resp: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const r = await confirmPayment({
            orderId: state.orderId!,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
          if (r.ok) {
            clear();
            router.push(`/checkout/confirmation?o=${encodeURIComponent(state.orderId!)}`);
          } else {
            setPayError(r.error ?? "Payment verification failed.");
            setPhase("error");
          }
        },
        modal: {
          ondismiss: () => {
            setPayError("Payment was cancelled. Your order is saved as pending.");
            setPhase("error");
          },
        },
        theme: { color: "#1a1a1a" },
      });
      rzp.open();
    })();
  }, [state, clear, router]);

  if (!hydrated) {
    return (
      <section className="cart-head">
        <h1>Checkout</h1>
        <span className="meta t-mono-xs">Loading…</span>
      </section>
    );
  }

  if (items.length === 0 && phase === "form") {
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

  const cartPayload = JSON.stringify(
    items.map((it) => ({
      slug: it.slug,
      qty: it.qty,
      size: it.size ?? null,
      colour: it.colour ?? null,
      isFabric: !!it.isFabric,
    })),
  );

  // Offline mode — no gateway configured: order is persisted as pending and we
  // hand off to WhatsApp for personal confirmation (brand fallback).
  const offline = state.ok && state.provider === "offline";
  const waHref = `${WHATSAPP_LINK}?text=${encodeURIComponent(
    `Hello Elite Zone J, I placed order ${state.orderId} for ${fmtINR(
      state.pricing?.total ?? subtotal,
    )}. Please confirm availability and share a payment link.`,
  )}`;

  return (
    <>
      <section className="cart-head">
        <h1>Checkout</h1>
        <span className="meta t-mono-xs">
          {fmtINR(subtotal)} · {items.length} line{items.length === 1 ? "" : "s"}
        </span>
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
          <h2>Shipping &amp; contact</h2>

          {offline ? (
            <div className="t-body-sm" style={{ display: "grid", gap: 12 }}>
              <p style={{ color: "var(--ink-2)" }}>
                Order <b>{state.orderId}</b> is saved. Online payment isn’t enabled
                yet — confirm with our atelier on WhatsApp and we’ll send a secure
                payment link.
              </p>
              <a className="btn btn-primary btn-lg btn-block" href={waHref} target="_blank" rel="noopener noreferrer">
                Confirm via WhatsApp
              </a>
              <Link className="btn btn-secondary btn-block" href="/cart">Back to bag</Link>
            </div>
          ) : (
            <form action={action} className="checkout-form" style={{ display: "grid", gap: 10 }}>
              <input type="hidden" name="cart" value={cartPayload} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input name="first_name" placeholder="First name" required aria-label="First name" />
                <input name="last_name" placeholder="Last name" required aria-label="Last name" />
              </div>
              <input type="email" name="email" placeholder="Email" required aria-label="Email" />
              <input name="phone" placeholder="Phone" required aria-label="Phone" />
              <input name="ship_line1" placeholder="Address line 1" required aria-label="Address line 1" />
              <input name="ship_line2" placeholder="Address line 2 (optional)" aria-label="Address line 2" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input name="ship_city" placeholder="City" required aria-label="City" />
                <input name="ship_state" placeholder="State" required aria-label="State" />
              </div>
              <input name="ship_pincode" placeholder="Pincode" inputMode="numeric" required aria-label="Pincode" />
              <input name="promo_code" placeholder="Promo code (optional)" aria-label="Promo code" />

              <div className="row total" style={{ marginTop: 8 }}>
                <span>Subtotal</span><b>{fmtINR(subtotal)}</b>
              </div>
              <p className="t-mono-xs" style={{ color: "var(--ink-2)" }}>
                Final total (incl. any promo &amp; shipping) is confirmed on the
                secure payment screen.
              </p>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                disabled={pending || phase === "paying"}
              >
                {pending ? "Preparing…" : phase === "paying" ? "Opening payment…" : "Pay securely"}
              </button>
              <Link className="btn btn-secondary btn-block" href="/cart">Back to bag</Link>

              {(state.error || payError) && (
                <p role="alert" className="t-mono-xs" style={{ color: "#b00" }}>
                  {payError ?? state.error}
                </p>
              )}
            </form>
          )}

          <div className="reassure t-mono-xs" style={{ marginTop: 16 }}>
            <span>✓ Secure card &amp; UPI payment</span>
            <span>✓ Free alterations within 30 days</span>
            <span>✓ Reach us on {WHATSAPP_DISPLAY}</span>
          </div>
        </aside>
      </section>
    </>
  );
}
