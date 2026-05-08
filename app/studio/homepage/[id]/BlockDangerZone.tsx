"use client";
import { useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { deleteBlockAction } from "../../actions/homepage";

export default function BlockDangerZone({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3 style={{ color: "var(--stu-error)" }}>Delete section</h3></header>
      <div className="stu-card__body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <p style={{ fontSize: 13, color: "var(--stu-text-3)", margin: 0 }}>
          This homepage section will be removed.
        </p>
        <button type="button" className="stu-btn stu-btn--danger" onClick={() => setOpen(true)}>Delete section</button>
      </div>
      <ConfirmDialog open={open} onClose={() => setOpen(false)}
                     title="Delete this section?" body="The section disappears from the homepage immediately."
                     formAction={deleteBlockAction} hidden={{ id: String(id) }} />
    </section>
  );
}
