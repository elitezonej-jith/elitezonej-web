"use client";
import { useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { deleteProductAction } from "../../actions/products";

export default function ProductDangerZone({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="stu-card">
      <header className="stu-card__head">
        <h3 style={{ color: "var(--stu-error)" }}>Danger zone</h3>
      </header>
      <div className="stu-card__body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <strong>Delete this product</strong>
          <p style={{ fontSize: 13, color: "var(--stu-text-3)", marginTop: 2 }}>
            This permanently removes the product, its images, and inventory rows. Past orders that reference it stay intact.
          </p>
        </div>
        <button type="button" className="stu-btn stu-btn--danger" onClick={() => setOpen(true)}>
          Delete product
        </button>
      </div>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Delete "${name}"?`}
        body="This action cannot be undone."
        confirmLabel="Yes, delete forever"
        formAction={deleteProductAction}
        hidden={{ slug }}
      />
    </section>
  );
}
