"use client";
import { useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { deleteBannerAction } from "../../actions/banners";

export default function BannerDangerZone({ id, title }: { id: number; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3 style={{ color: "var(--stu-error)" }}>Delete banner</h3></header>
      <div className="stu-card__body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <p style={{ fontSize: 13, color: "var(--stu-text-3)", margin: 0 }}>
          This banner will be permanently removed. The image stays in your media library.
        </p>
        <button type="button" className="stu-btn stu-btn--danger" onClick={() => setOpen(true)}>Delete banner</button>
      </div>
      <ConfirmDialog open={open} onClose={() => setOpen(false)}
                     title={`Delete "${title || "this banner"}"?`}
                     body="This action cannot be undone."
                     formAction={deleteBannerAction} hidden={{ id: String(id) }} />
    </section>
  );
}
