"use client";
import { setOrderStatusStudioAction } from "../../actions/orders";
import { saveOrderNotesAction } from "../../../admin/actions/orders";

const FLOW = [
  { key: "new", label: "New" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_atelier", label: "In atelier" },
  { key: "shipped", label: "Shipped" },
  { key: "fulfilled", label: "Fulfilled" },
  { key: "cancelled", label: "Cancelled" },
];

type OrderItem = { product_name: string; size: string | null; qty: number; unit_price: number };

export default function OrderControls({ id, status, notes, items, orderSummary }: {
  id: string; status: string; notes: string;
  items?: OrderItem[];
  orderSummary?: string;
}) {
  const isNew = status === "new";

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
                <button type="submit" className={`stu-btn stu-btn--sm ${status === s.key ? (s.key === "cancelled" ? "stu-btn--danger" : "stu-btn--primary") : "stu-btn--ghost"}`}>{s.label}</button>
              </form>
            ))}
          </div>
        </div>
      </section>

      <section className="stu-card">
        <header className="stu-card__head"><h3>Quick actions</h3></header>
        <div className="stu-card__body">
          <button type="button" onClick={copyOrder} className="stu-btn stu-btn--ghost stu-btn--sm">
            Copy order details
          </button>
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
