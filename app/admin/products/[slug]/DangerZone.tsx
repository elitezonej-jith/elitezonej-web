"use client";
import { useState } from "react";
import { setProductStatusAction, deleteProductAction } from "../../actions/products";
import DeedOfAction from "../../components/DeedOfAction";

export default function DangerZone({ slug, status, name }: { slug: string; status: string; name: string }) {
  const [open, setOpen] = useState(false);
  const next = status === "active" ? "archived" : "active";
  const nextLabel = status === "active" ? "Archive piece" : "Reactivate piece";

  return (
    <div className="adm-panel">
      <div className="adm-cols--equal">
        <div>
          <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontWeight: 500, fontSize: 24, margin: 0 }}>
            {nextLabel}
          </h3>
          <p className="adm-italic" style={{ marginTop: 8, fontSize: 15 }}>
            {status === "active"
              ? "An archived piece disappears from the live catalogue but stays in the workbook for record."
              : "Bringing the piece back makes it visible to customers again."}
          </p>
          <form action={setProductStatusAction} style={{ marginTop: 16 }}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="status" value={next} />
            <button type="submit" className="adm-btn adm-btn--ghost">{nextLabel}</button>
          </form>
        </div>
        <div>
          <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontWeight: 500, fontSize: 24, margin: 0, color: "var(--adm-accent)" }}>
            Delete forever
          </h3>
          <p className="adm-italic" style={{ marginTop: 8, fontSize: 15 }}>
            Removes the piece, its inventory rows, and any colour entries.
            Order history that references it remains intact.
          </p>
          <button
            type="button"
            className="adm-btn adm-btn--danger"
            style={{ marginTop: 16 }}
            onClick={() => setOpen(true)}
          >
            Delete piece
          </button>
        </div>
      </div>

      <DeedOfAction
        open={open}
        onClose={() => setOpen(false)}
        title={`You are about to delete ${name.toUpperCase()}.`}
        body="This action cannot be undone. The piece, every size in inventory, and every colourway entry will be removed from the workbook."
        confirmLabel="Yes, delete forever"
        cancelLabel="Reconsider"
        formAction={deleteProductAction}
        hidden={{ slug }}
      />
    </div>
  );
}
