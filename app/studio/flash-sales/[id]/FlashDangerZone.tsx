"use client";
import { useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { deleteFlashSaleAction } from "../../actions/flash-sales";

export default function FlashDangerZone({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3 style={{ color: "var(--stu-error)" }}>Delete flash sale</h3></header>
      <div className="stu-card__body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <p style={{ fontSize: 13, color: "var(--stu-text-3)", margin: 0 }}>The countdown banner will be removed.</p>
        <button type="button" className="stu-btn stu-btn--danger" onClick={() => setOpen(true)}>Delete</button>
      </div>
      <ConfirmDialog open={open} onClose={() => setOpen(false)}
                     title="Delete this flash sale?" body="This action cannot be undone."
                     formAction={deleteFlashSaleAction} hidden={{ id: String(id) }} />
    </section>
  );
}
