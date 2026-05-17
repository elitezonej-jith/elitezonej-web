"use client";
import { useActionState, useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fmtINR, fmtMeters } from "@/lib/format";
import { WHATSAPP_DISPLAY } from "@/lib/contact";
import { useCart } from "../components/CartProvider";
import { startCheckout, confirmPayment, previewPricing, type CheckoutStartState, type PreviewState } from "./actions";
import MockPaymentSheet from "./MockPaymentSheet";
import type { Address } from "../../lib/admin/repos/addresses";
import "../styles/cart.css";
import "../styles/addresses.css";

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

/** Client-side rules mirroring the authoritative server CheckoutSchema in
 *  actions.ts. UX only — the server Zod validation stays the source of truth.
 *  Returns "" when valid, else the message (kept identical to the server's). */
const CHECKOUT_RULES: Record<string, (v: string) => string> = {
  email: (v) =>
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()) && v.trim().length <= 160
      ? ""
      : "A valid email is required",
  phone: (v) => (v.trim().length >= 6 && v.trim().length <= 40 ? "" : "Phone number is required"),
  first_name: (v) => (v.trim().length >= 1 && v.trim().length <= 60 ? "" : "First name is required"),
  last_name: (v) => (v.trim().length >= 1 && v.trim().length <= 60 ? "" : "Last name is required"),
  ship_line1: (v) => (v.trim().length >= 1 && v.trim().length <= 200 ? "" : "Enter your address"),
  ship_city: (v) => (v.trim().length >= 1 && v.trim().length <= 80 ? "" : "City is required"),
  ship_state: (v) => (v.trim().length >= 1 && v.trim().length <= 80 ? "" : "State is required"),
  ship_pincode: (v) => (/^\d{6}$/.test(v.trim()) ? "" : "Enter a valid 6-digit pincode"),
};
/** Submit order = focus order of the first invalid field. */
const CHECKOUT_FIELD_ORDER = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "ship_line1",
  "ship_city",
  "ship_state",
  "ship_pincode",
] as const;

/** Text input with an inline, screen-reader-associated validation error.
 *  The error line is always rendered (empty when valid) so it reserves its
 *  own space — appearing/clearing an error causes no layout shift. The
 *  uncontrolled input retains its typed value across a failed submit
 *  (React 19 server-action forms are not reset). */
function Field({ err, ...props }: InputHTMLAttributes<HTMLInputElement> & { err?: string }) {
  const errId = props.name ? `err-${props.name}` : undefined;
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <input
        {...props}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? errId : props["aria-describedby"]}
      />
      <span
        id={errId}
        role="alert"
        className="t-mono-xs"
        style={{ color: "var(--error)", minHeight: "1em", lineHeight: 1.1 }}
      >
        {err ?? ""}
      </span>
    </div>
  );
}

type ShipPrefill = {
  first_name: string;
  last_name: string;
  ship_line1: string;
  ship_line2: string;
  ship_city: string;
  ship_state: string;
  ship_pincode: string;
};

function toPrefill(a: Address): ShipPrefill {
  return {
    first_name: a.first_name,
    last_name: a.last_name,
    ship_line1: a.line1,
    ship_line2: a.line2,
    ship_city: a.city,
    ship_state: a.state,
    ship_pincode: a.pincode,
  };
}

export default function CheckoutClient({
  savedAddresses = [],
  defaultAddressId = null,
}: {
  savedAddresses?: Address[];
  defaultAddressId?: number | null;
}) {
  const { items, subtotal, hydrated, clear } = useCart();
  const router = useRouter();
  const [state, action, pending] = useActionState(startCheckout, initial);
  const [phase, setPhase] = useState<"form" | "paying" | "error">("form");
  const [payError, setPayError] = useState<string | null>(null);
  const [sandboxDismissed, setSandboxDismissed] = useState(false);
  const launched = useRef(false);

  // Saved-address picker. The default address (if any) is auto-selected and
  // its values prefilled; "new" means manual entry. Changing selection bumps
  // prefillKey so the uncontrolled ship_* inputs remount with new defaults —
  // CHECKOUT_RULES / guardSubmit / the server CheckoutSchema are unaffected.
  const initialSel =
    defaultAddressId != null &&
    savedAddresses.some((a) => a.id === defaultAddressId)
      ? defaultAddressId
      : "new";
  const [selectedAddr, setSelectedAddr] = useState<number | "new">(initialSel);
  const [prefillKey, setPrefillKey] = useState(0);
  const initialPrefill =
    typeof initialSel === "number"
      ? toPrefill(savedAddresses.find((a) => a.id === initialSel)!)
      : null;
  const [prefill, setPrefill] = useState<ShipPrefill | null>(initialPrefill);

  function chooseAddress(sel: number | "new") {
    setSelectedAddr(sel);
    const a = typeof sel === "number" ? savedAddresses.find((x) => x.id === sel) : null;
    setPrefill(a ? toPrefill(a) : null);
    setPrefillKey((k) => k + 1);
    setClientErrors({});
  }

  // Client-side address validation (UX only; server Zod stays authoritative).
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  function validateField(name: string, value: string) {
    const rule = CHECKOUT_RULES[name];
    if (!rule) return;
    setClientErrors((prev) => {
      const msg = rule(value);
      if ((prev[name] ?? "") === msg) return prev;
      const next = { ...prev };
      if (msg) next[name] = msg;
      else delete next[name];
      return next;
    });
  }

  // Run all rules on submit; block the server action and focus the first
  // invalid field if anything fails. The server still re-validates.
  function guardSubmit(e: FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const errs: Record<string, string> = {};
    for (const name of CHECKOUT_FIELD_ORDER) {
      const el = form.elements.namedItem(name) as HTMLInputElement | null;
      const msg = CHECKOUT_RULES[name]?.(el?.value ?? "") ?? "";
      if (msg) errs[name] = msg;
    }
    if (Object.keys(errs).length > 0) {
      e.preventDefault();
      setClientErrors(errs);
      const first = CHECKOUT_FIELD_ORDER.find((n) => errs[n]);
      if (first) (form.elements.namedItem(first) as HTMLInputElement | null)?.focus();
    }
  }

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

          <form action={action} onSubmit={guardSubmit} className="checkout-form" style={{ display: "grid", gap: 10 }}>
            <input type="hidden" name="cart" value={cartPayload} />
            <input type="hidden" name="idempotency_key" value={idemKey} />

            {savedAddresses.length > 0 && (
              <fieldset className="addr-picker">
                <legend>Ship to a saved address</legend>
                {savedAddresses.map((a) => (
                  <label key={a.id} className="addr-pick">
                    <input
                      type="radio"
                      name="saved_address_pick"
                      value={a.id}
                      checked={selectedAddr === a.id}
                      onChange={() => chooseAddress(a.id)}
                    />
                    <span className="addr-pick-text">
                      <b>
                        {a.first_name} {a.last_name}
                      </b>
                      {a.is_default === 1 && (
                        <span className="addr-pick-default">Default</span>
                      )}
                      <br />
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state}{" "}
                      {a.pincode}
                    </span>
                  </label>
                ))}
                <label className="addr-pick">
                  <input
                    type="radio"
                    name="saved_address_pick"
                    value="new"
                    checked={selectedAddr === "new"}
                    onChange={() => chooseAddress("new")}
                  />
                  <span className="addr-pick-text">
                    <b>Enter a new address</b>
                  </span>
                </label>
              </fieldset>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field key={`first_name-${prefillKey}`} name="first_name" placeholder="First name" required aria-label="First name" defaultValue={prefill?.first_name ?? ""} onBlur={(e) => validateField("first_name", e.target.value)} err={clientErrors.first_name ?? state.fieldErrors?.first_name} />
              <Field key={`last_name-${prefillKey}`} name="last_name" placeholder="Last name" required aria-label="Last name" defaultValue={prefill?.last_name ?? ""} onBlur={(e) => validateField("last_name", e.target.value)} err={clientErrors.last_name ?? state.fieldErrors?.last_name} />
            </div>
            <Field type="email" name="email" placeholder="Email" required aria-label="Email" onBlur={(e) => validateField("email", e.target.value)} err={clientErrors.email ?? state.fieldErrors?.email} />
            <Field name="phone" placeholder="Phone" required aria-label="Phone" onBlur={(e) => validateField("phone", e.target.value)} err={clientErrors.phone ?? state.fieldErrors?.phone} />
            <Field key={`ship_line1-${prefillKey}`} name="ship_line1" placeholder="Address line 1" required aria-label="Address line 1" defaultValue={prefill?.ship_line1 ?? ""} onBlur={(e) => validateField("ship_line1", e.target.value)} err={clientErrors.ship_line1 ?? state.fieldErrors?.ship_line1} />
            <Field key={`ship_line2-${prefillKey}`} name="ship_line2" placeholder="Address line 2 (optional)" aria-label="Address line 2" defaultValue={prefill?.ship_line2 ?? ""} err={state.fieldErrors?.ship_line2} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field key={`ship_city-${prefillKey}`} name="ship_city" placeholder="City" required aria-label="City" defaultValue={prefill?.ship_city ?? ""} onBlur={(e) => validateField("ship_city", e.target.value)} err={clientErrors.ship_city ?? state.fieldErrors?.ship_city} />
              <Field key={`ship_state-${prefillKey}`} name="ship_state" placeholder="State" required aria-label="State" defaultValue={prefill?.ship_state ?? ""} onBlur={(e) => validateField("ship_state", e.target.value)} err={clientErrors.ship_state ?? state.fieldErrors?.ship_state} />
            </div>
            <Field key={`ship_pincode-${prefillKey}`} name="ship_pincode" placeholder="Pincode" inputMode="numeric" required aria-label="Pincode" defaultValue={prefill?.ship_pincode ?? ""} onBlur={(e) => validateField("ship_pincode", e.target.value)} err={clientErrors.ship_pincode ?? state.fieldErrors?.ship_pincode} />
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
