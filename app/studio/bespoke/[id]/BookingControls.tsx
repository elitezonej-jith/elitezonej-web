"use client";
import { setBookingStatusAction } from "../../../admin/actions/bookings";

const FLOW = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "scheduled", label: "Scheduled" },
  { key: "done", label: "Done" },
  { key: "closed", label: "Closed" },
];

export default function BookingControls({ id, status }: { id: number; status: string }) {
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3>Status</h3></header>
      <div className="stu-card__body">
        <div className="stu-btn-row">
          {FLOW.map((s) => (
            <form key={s.key} action={setBookingStatusAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value={s.key} />
              <button type="submit" className={`stu-btn stu-btn--sm ${status === s.key ? "stu-btn--primary" : "stu-btn--ghost"}`}>{s.label}</button>
            </form>
          ))}
        </div>
      </div>
    </section>
  );
}
