"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fmtINR, fmtMeters } from "@/lib/format";
import { WHATSAPP_DISPLAY } from "@/lib/contact";
import { useCart } from "../components/CartProvider";
import { startCheckout, confirmPayment, previewPricing, type CheckoutStartState, type PreviewState } from "./actions";
import MockPaymentSheet from "./MockPaymentSheet";
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
  const [sandboxDismissed, setSandboxDismissed] = useState(false);
  const launched = useRef(false);

  // Live promo / total preview (QA-011) — read-only, no order is created.
  const [promo, setPromo] = useState("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewPending, setPreviewPending] = useState(false);

  // Stable per-checkout key so a double-submit / retry resumes the same order
  // server-side instead of creating a duplicate.
  const [idemKey] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `idem_${Date.now()}_${Math.random().toString(16).slice(2)}`,
  );

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
            router.push(
              `/checkout/confirmation?o=${encodeURIComponent(state.orderId!)}` +
                (state.token ? `&t=${encodeURIComponent(state.token)}` : ""),
            );
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

  async function runPreview() {
    setPreviewPending(true);
    try {
      const fd = new FormData();
      fd.set("cart", cartPayload);
      fd.set("promo_code", promo);
      const res = await previewPricing({}, fd);
      setPreview(res);
    } catch {
      setPreview({ ok: false, error: "Could not check the code. Please retry." });
    } finally {
      setPreviewPending(false);
    }
  }

  // Sandbox mode — no live Razorpay keys configured. The order is persisted
  // (pending) and we present an in-app simulated gateway. The instant real
  // keys are set, startCheckout returns provider="razorpay" and the block
  // above opens the real modal instead — no other change required.
  const sandboxOpen =
    !!state.ok &&
    state.provider === "offline" &&
    !!state.orderId &&
    !sandboxDismissed;

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

          <form action={action} className="checkout-form" style={{ display: "grid", gap: 10 }}>
            <input type="hidden" name="cart" value={cartPayload} />
            <input type="hidden" name="idempotency_key" value={idemKey} />
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <input
                name="promo_code"
                placeholder="Promo code (optional)"
                aria-label="Promo code"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={runPreview}
                disabled={previewPending}
              >
                {previewPending ? "Checking…" : "Apply"}
              </button>
            </div>

            {preview?.promoMessage && (
              <p
                role="status"
                className="t-mono-xs"
                style={{ color: preview.promoApplied ? "var(--success)" : "var(--error)" }}
              >
                {preview.promoApplied ? "✓ " : ""}{preview.promoMessage}
              </p>
            )}

            <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
              <div className="row">
                <span>Subtotal</span>
                <span>{fmtINR(preview?.pricing?.subtotal ?? subtotal)}</span>
              </div>
              {!!preview?.pricing && preview.pricing.discount > 0 && (
                <div className="row">
                  <span>Discount{preview.pricing.promo_code ? ` (${preview.pricing.promo_code})` : ""}</span>
                  <span>−{fmtINR(preview.pricing.discount)}</span>
                </div>
              )}
              {!!preview?.pricing && (
                <>
                  <div className="row">
                    <span>Shipping</span>
                    <span>{preview.pricing.shipping > 0 ? fmtINR(preview.pricing.shipping) : "Free"}</span>
                  </div>
                  {preview.pricing.tax > 0 && (
                    <div className="row"><span>Tax</span><span>{fmtINR(preview.pricing.tax)}</span></div>
                  )}
                </>
              )}
              <div className="row total">
                <span>Total</span>
                <b>{fmtINR(preview?.pricing?.total ?? subtotal)}</b>
              </div>
            </div>
            <p className="t-mono-xs" style={{ color: "var(--ink-2)" }}>
              {preview?.pricing
                ? "Final total is confirmed on the secure payment screen."
                : "Taxes & any promo are confirmed on the secure payment screen."}
            </p>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={pending || phase === "paying" || sandboxOpen}
            >
              {pending
                ? "Preparing…"
                : phase === "paying" || sandboxOpen
                  ? "Opening payment…"
                  : "Pay securely"}
            </button>
            <Link className="btn btn-secondary btn-block" href="/cart">Back to bag</Link>

            {(state.error || payError) && (
              <p role="alert" className="t-mono-xs" style={{ color: "var(--error)" }}>
                {payError ?? state.error}
              </p>
            )}
          </form>

          <div className="reassure t-mono-xs" style={{ marginTop: 16 }}>
            <span>✓ Secure card &amp; UPI payment</span>
            <span>✓ Free alterations within 30 days</span>
            <span>✓ Reach us on {WHATSAPP_DISPLAY}</span>
          </div>
        </aside>
      </section>

      {sandboxOpen && (
        <MockPaymentSheet
          orderId={state.orderId!}
          token={state.token ?? ""}
          amount={state.amount ?? state.pricing?.total ?? subtotal}
          onClose={() => setSandboxDismissed(true)}
          onSuccess={(oid) => {
            clear();
            router.push(
              `/checkout/confirmation?o=${encodeURIComponent(oid)}` +
                (state.token ? `&t=${encodeURIComponent(state.token)}` : ""),
            );
          }}
        />
      )}
    </>
  );
}
