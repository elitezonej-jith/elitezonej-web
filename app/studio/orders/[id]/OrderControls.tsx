"use client";
import { setOrderStatusAction, saveOrderNotesAction } from "../../../admin/actions/orders";

const FLOW = [
  { key: "new", label: "New" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_atelier", label: "In atelier" },
  { key: "shipped", label: "Shipped" },
  { key: "fulfilled", label: "Fulfilled" },
  { key: "cancelled", label: "Cancelled" },
];

export default function OrderControls({ id, status, notes }: { id: string; status: string; notes: string }) {
  return (
    <div className="stu-stack">
      <section className="stu-card">
        <header className="stu-card__head"><h3>Status</h3></header>
        <div className="stu-card__body">
          <div className="stu-btn-row">
            {FLOW.map((s) => (
              <form key={s.key} action={setOrderStatusAction}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value={s.key} />
                <button type="submit" className={`stu-btn stu-btn--sm ${status === s.key ? (s.key === "cancelled" ? "stu-btn--danger" : "stu-btn--primary") : "stu-btn--ghost"}`}>{s.label}</button>
              </form>
            ))}
          </div>
        </div>
      </section>
      <form action={saveOrderNotesAction} className="stu-card">
        <header className="stu-card__head"><h3>Notes</h3></header>
        <div className="stu-card__body">
          <input type="hidden" name="id" value={id} />
          <textarea name="notes" defaultValue={notes} className="stu-textarea" rows={5} placeholder="Special instructions for the atelier…" />
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <button type="submit" className="stu-btn stu-btn--ghost">Save notes</button>
          </div>
        </div>
      </form>
    </div>
  );
}
