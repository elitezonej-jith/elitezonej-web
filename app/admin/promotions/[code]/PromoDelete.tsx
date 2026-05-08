"use client";
import { useState } from "react";
import { deletePromoAction } from "../../actions/promotions";
import DeedOfAction from "../../components/DeedOfAction";

export default function PromoDelete({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="adm-panel">
      <p className="adm-italic">Removing a promotion deletes it from the ledger but does not affect orders that have already used it.</p>
      <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => setOpen(true)} style={{ marginTop: 12 }}>
        Delete promotion
      </button>
      <DeedOfAction
        open={open}
        onClose={() => setOpen(false)}
        title={`You are about to delete the code ${code}.`}
        body="This action cannot be undone."
        confirmLabel="Yes, delete"
        formAction={deletePromoAction}
        hidden={{ code }}
      />
    </div>
  );
}
