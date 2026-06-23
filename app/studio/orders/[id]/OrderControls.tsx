"use client";
import { setOrderStatusStudioAction, shipOrderStudioAction, markDeliveredStudioAction, saveOrderNotesStudioAction } from "../../actions/orders";

const FLOW = [
  { key: "new", label: "New" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_atelier", label: "In atelier" },
  { key: "cancelled", label: "Cancelled" },
];

type CourierOption = { code: string; name: string };
type TrackingInfo = { courier_name: string | null; tracking_number: string | null; tracking_url: string | null; shipped_at: string | null };
type OrderItem = { product_name: string; size: string | null; qty: number; unit_price: number };

export default function OrderControls({ id, status, notes, couriers, tracking, items, orderSummary }: {
  id: string; status: string; notes: string;
  couriers: CourierOption[];
  tracking: TrackingInfo;
  items?: OrderItem[];
  orderSummary?: string;
}) {
  const isNew = status === "new";
  const canShip = status === "confirmed" || status === "in_atelier";
  const isShipped = status === "shipped";
  const isTerminal = status === "shipped" || status === "fulfilled";

  function copyOrder() {
    const text = orderSummary || `Order #${id}`;
    navigator.clipboard.writeText(text).then(() => {
      alert("Order details copied!");
    });
  }

  return (
    <div className="stu-stack">
      <section className="stu-card">
        <header className="stu-card__head"><h3>Status</h3></header>
        <div className="stu-card__body">
          {isNew && items && items.length > 0 && (
            <div className="stu-hint" style={{ marginBottom: 12, padding: "8px 12px", background: "#fff8e1", borderRadius: 6, fontSize: 12 }}>
              ⚠ Confirming will deduct stock for {items.length} item{items.length > 1 ? "s" : ""}. Make sure inventory is sufficient.
            </div>
          )}
          <div className="stu-btn-row">
            {FLOW.map((s) => (
              <form key={s.key} action={setOrderStatusStudioAction}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value={s.key} />
                <button type="submit" disabled={isTerminal} className={`stu-btn stu-btn--sm ${status === s.key ? (s.key === "cancelled" ? "stu-btn--danger" : "stu-btn--primary") : "stu-btn--ghost"}`}>{s.label}</button>
              </form>
            ))}
          </div>
        </div>
      </section>

      {/* Ship form — shown when order is ready */}
      {canShip && (
        <form action={shipOrderStudioAction} className="stu-card">
          <header className="stu-card__head"><h3>Ship order</h3></header>
          <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="hidden" name="id" value={id} />
            <label className="stu-field">
              <span className="stu-field__label">Courier</span>
              <select name="courier_code" className="stu-field__select" required>
                <option value="">Select courier…</option>
                {couriers.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="stu-field">
              <span className="stu-field__label">AWB / Tracking number</span>
              <input type="text" name="tracking_number" className="stu-field__input" required placeholder="e.g. 1234567890" />
            </label>
            <label className="stu-field">
              <span className="stu-field__label">Tracking URL (optional)</span>
              <input type="url" name="tracking_url" className="stu-field__input" placeholder="Leave blank to auto-generate" />
            </label>
            <div style={{ marginTop: 4 }}>
              <button type="submit" className="stu-btn stu-btn--primary">Mark Shipped</button>
            </div>
          </div>
        </form>
      )}

      {/* Tracking info — shown when shipped or delivered */}
      {(isShipped || status === "fulfilled") && tracking.courier_name && tracking.tracking_number && (
        <section className="stu-card">
          <header className="stu-card__head"><h3>Tracking</h3></header>
          <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span><strong>Courier:</strong> {tracking.courier_name}</span>
            <span><strong>AWB:</strong> {tracking.tracking_number}</span>
            {tracking.tracking_url && (
              <a href={tracking.tracking_url} target="_blank" rel="noopener noreferrer" className="stu-btn stu-btn--ghost stu-btn--sm" style={{ alignSelf: "flex-start" }}>
                Track on courier site ↗
              </a>
            )}
            {tracking.shipped_at && (
              <span suppressHydrationWarning style={{ fontSize: 12, color: "var(--stu-text-3)" }}>
                Shipped {new Date(tracking.shipped_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            {isShipped && (
              <form action={markDeliveredStudioAction} style={{ marginTop: 8 }} onSubmit={(e) => { if (!confirm("Mark this order as delivered? This cannot be undone.")) e.preventDefault(); }}>
                <input type="hidden" name="id" value={id} />
                <button type="submit" className="stu-btn stu-btn--primary stu-btn--sm">Mark Delivered</button>
              </form>
            )}
          </div>
        </section>
      )}

      <section className="stu-card">
        <header className="stu-card__head"><h3>Quick actions</h3></header>
        <div className="stu-card__body">
          <button type="button" onClick={copyOrder} className="stu-btn stu-btn--ghost stu-btn--sm">
            Copy order details
          </button>
        </div>
      </section>

      <form action={saveOrderNotesStudioAction} className="stu-card">
        <header className="stu-card__head"><h3>Notes</h3></header>
        <div className="stu-card__body">
          <input type="hidden" name="id" value={id} />
          <textarea name="notes" defaultValue={notes} className="stu-textarea" rows={5} placeholder="Special instructions for the atelier…" aria-label="Order notes" />
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <button type="submit" className="stu-btn stu-btn--ghost">Save notes</button>
          </div>
        </div>
      </form>
    </div>
  );
}
