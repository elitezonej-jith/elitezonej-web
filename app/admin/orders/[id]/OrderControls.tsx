"use client";
import { useState } from "react";
import { setOrderStatusAction, saveOrderNotesAction, shipOrderAction, markDeliveredAction } from "../../actions/orders";
import StatusPill from "../../components/StatusPill";

const FLOW: Array<{ key: string; label: string }> = [
  { key: "new",         label: "New" },
  { key: "confirmed",   label: "Confirmed" },
  { key: "in_atelier",  label: "In atelier" },
  { key: "cancelled",   label: "Cancelled" },
];

type CourierOption = { code: string; name: string };
type TrackingInfo = { courier_name: string | null; tracking_number: string | null; tracking_url: string | null; shipped_at: string | null };

export default function OrderControls({ id, status, notes, couriers, tracking }: {
  id: string; status: string; notes: string;
  couriers: CourierOption[];
  tracking: TrackingInfo;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const canShip = status === "confirmed" || status === "in_atelier";
  const isShipped = status === "shipped";
  const isTerminal = status === "shipped" || status === "fulfilled";

  return (
    <div className="adm-stack">
      <div className="adm-panel">
        <div className="adm-mono" style={{ marginBottom: 12, color: "var(--adm-ink-3)" }}>Set status</div>
        <div className="adm-btn-row">
          {FLOW.map((s) => (
            <form
              key={s.key}
              action={setOrderStatusAction}
              onSubmit={() => setPending(s.key)}
            >
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value={s.key} />
              <button
                type="submit"
                className={`adm-btn adm-btn--sm ${
                  status === s.key ? (s.key === "cancelled" ? "adm-btn--danger" : "adm-btn--primary") : "adm-btn--ghost"
                }`}
                disabled={pending !== null || isTerminal}
              >
                {s.label}
              </button>
            </form>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <span className="adm-italic">Currently: </span>
          <StatusPill status={status} />
        </div>
      </div>

      {/* Ship order form — shown when order is ready to ship */}
      {canShip && (
        <form action={shipOrderAction} className="adm-panel">
          <div className="adm-mono" style={{ marginBottom: 12, color: "var(--adm-ink-3)" }}>Ship this order</div>
          <input type="hidden" name="id" value={id} />
          <label className="adm-field">
            <span className="adm-field__label">Courier</span>
            <select name="courier_code" className="adm-field__select" required>
              <option value="">Select courier…</option>
              {couriers.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="adm-field" style={{ marginTop: 8 }}>
            <span className="adm-field__label">AWB / Tracking number</span>
            <input type="text" name="tracking_number" className="adm-field__input" required placeholder="e.g. 1234567890" />
          </label>
          <label className="adm-field" style={{ marginTop: 8 }}>
            <span className="adm-field__label">Tracking URL (optional override)</span>
            <input type="url" name="tracking_url" className="adm-field__input" placeholder="Leave blank to auto-generate" />
          </label>
          <div style={{ marginTop: 12 }}>
            <button type="submit" className="adm-btn adm-btn--primary">Mark Shipped</button>
          </div>
        </form>
      )}

      {/* Tracking info display when shipped or delivered */}
      {(isShipped || status === "fulfilled") && tracking.courier_name && tracking.tracking_number && (
        <div className="adm-panel">
          <div className="adm-mono" style={{ marginBottom: 12, color: "var(--adm-ink-3)" }}>Tracking</div>
          <ul className="adm-bullets">
            <li><span className="adm-mono" style={{ minWidth: 96 }}>Courier</span> {tracking.courier_name}</li>
            <li><span className="adm-mono" style={{ minWidth: 96 }}>AWB</span> {tracking.tracking_number}</li>
            {tracking.tracking_url && (
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Track</span> <a href={tracking.tracking_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--adm-accent)" }}>View on courier site ↗</a></li>
            )}
            {tracking.shipped_at && (
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Shipped</span> <span suppressHydrationWarning>{new Date(tracking.shipped_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></li>
            )}
          </ul>
          {isShipped && (
            <form action={markDeliveredAction} style={{ marginTop: 12 }} onSubmit={(e) => { if (!confirm("Mark this order as delivered? This cannot be undone.")) e.preventDefault(); }}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="adm-btn adm-btn--primary">Mark Delivered</button>
            </form>
          )}
        </div>
      )}

      <form action={saveOrderNotesAction} className="adm-panel">
        <input type="hidden" name="id" value={id} />
        <label className="adm-field">
          <span className="adm-field__label">Atelier notes</span>
          <textarea name="notes" defaultValue={notes} className="adm-field__textarea" rows={5}
                    placeholder="Customer requested expedited fitting…" />
        </label>
        <div style={{ marginTop: 12 }}>
          <button type="submit" className="adm-btn adm-btn--ghost">Save notes</button>
        </div>
      </form>
    </div>
  );
}
