"use client";
import { useState } from "react";
import { setOrderStatusAction, saveOrderNotesAction } from "../../actions/orders";
import StatusPill from "../../components/StatusPill";

const FLOW: Array<{ key: string; label: string }> = [
  { key: "new",         label: "New" },
  { key: "confirmed",   label: "Confirmed" },
  { key: "in_atelier",  label: "In atelier" },
  { key: "shipped",     label: "Shipped" },
  { key: "fulfilled",   label: "Fulfilled" },
  { key: "cancelled",   label: "Cancelled" },
];

export default function OrderControls({ id, status, notes }: { id: string; status: string; notes: string }) {
  const [pending, setPending] = useState<string | null>(null);
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
                disabled={pending !== null}
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
