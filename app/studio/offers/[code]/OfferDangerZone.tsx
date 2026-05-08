"use client";
import { useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { deleteOfferAction } from "../../actions/offers";

export default function OfferDangerZone({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3 style={{ color: "var(--stu-error)" }}>Delete offer</h3></header>
      <div className="stu-card__body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <p style={{ fontSize: 13, color: "var(--stu-text-3)", margin: 0 }}>
          Past orders that already used this code aren't affected.
        </p>
        <button type="button" className="stu-btn stu-btn--danger" onClick={() => setOpen(true)}>Delete</button>
      </div>
      <ConfirmDialog open={open} onClose={() => setOpen(false)}
                     title={`Delete code "${code}"?`} body="This action cannot be undone."
                     formAction={deleteOfferAction} hidden={{ code }} />
    </section>
  );
}
