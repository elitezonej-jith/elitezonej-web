"use client";
import { useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { deleteNoticeAction } from "../../actions/notices";

export default function NoticeDangerZone({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3 style={{ color: "var(--stu-error)" }}>Delete notice</h3></header>
      <div className="stu-card__body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <p style={{ fontSize: 13, color: "var(--stu-text-3)", margin: 0 }}>
          Permanently remove this notice from the storefront.
        </p>
        <button type="button" className="stu-btn stu-btn--danger" onClick={() => setOpen(true)}>Delete notice</button>
      </div>
      <ConfirmDialog open={open} onClose={() => setOpen(false)}
                     title="Delete this notice?"
                     body="This action cannot be undone."
                     formAction={deleteNoticeAction} hidden={{ id: String(id) }} />
    </section>
  );
}
