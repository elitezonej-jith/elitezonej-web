"use client";
import { useState } from "react";
import { setBookingStatusAction, deleteBookingAction } from "../../actions/bookings";
import StatusPill from "../../components/StatusPill";
import DeedOfAction from "../../components/DeedOfAction";

const FLOW = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "scheduled", label: "Scheduled" },
  { key: "done", label: "Done" },
  { key: "closed", label: "Closed" },
];

export default function BookingControls({ id, status }: { id: number; status: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="adm-stack">
      <div className="adm-panel">
        <div className="adm-mono" style={{ marginBottom: 12, color: "var(--adm-ink-3)" }}>Set status</div>
        <div className="adm-btn-row">
          {FLOW.map((s) => (
            <form key={s.key} action={setBookingStatusAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value={s.key} />
              <button
                type="submit"
                className={`adm-btn adm-btn--sm ${status === s.key ? "adm-btn--primary" : "adm-btn--ghost"}`}
              >
                {s.label}
              </button>
            </form>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <span className="adm-italic">Currently: </span>
          <StatusPill status={status} />
        </div>
      </div>

      <div className="adm-panel">
        <h3 style={{ margin: 0, fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontWeight: 500, fontSize: 22, color: "var(--adm-accent)" }}>
          Remove from inbox
        </h3>
        <p className="adm-italic" style={{ marginTop: 8 }}>Use only for spam or duplicate leads — closed leads stay in the workbook.</p>
        <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => setOpen(true)} style={{ marginTop: 12 }}>
          Delete lead
        </button>
      </div>

      <DeedOfAction
        open={open}
        onClose={() => setOpen(false)}
        title="You are about to delete this bespoke lead."
        body="This action cannot be undone. Use 'Closed' status if you want to keep the record without acting on it."
        confirmLabel="Yes, delete forever"
        formAction={deleteBookingAction}
        hidden={{ id: String(id) }}
      />
    </div>
  );
}
