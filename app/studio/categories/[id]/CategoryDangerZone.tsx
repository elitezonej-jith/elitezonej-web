"use client";
import { useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { deleteCategoryAction } from "../../actions/categories";

export default function CategoryDangerZone({ id, name }: { id: number; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3 style={{ color: "var(--stu-error)" }}>Delete category</h3></header>
      <div className="stu-card__body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <p style={{ fontSize: 13, color: "var(--stu-text-3)", margin: 0 }}>
          Removes the category and any child entries. Products tagged here keep their other tags.
        </p>
        <button type="button" className="stu-btn stu-btn--danger" onClick={() => setOpen(true)}>Delete category</button>
      </div>
      <ConfirmDialog open={open} onClose={() => setOpen(false)} title={`Delete "${name}"?`}
                     body="This action cannot be undone." formAction={deleteCategoryAction} hidden={{ id: String(id) }} />
    </section>
  );
}
