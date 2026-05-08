import { notFound } from "next/navigation";
import Link from "next/link";
import { getBooking } from "../../../../lib/admin/repos/bookings";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import BookingControls from "./BookingControls";
import { dateTime } from "../../../../lib/admin/format";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

export default async function BookingPage({ params }: Params) {
  const { id } = await params;
  const b = getBooking(Number(id));
  if (!b) notFound();
  return (
    <div className="stu-page">
      <PageHead title={`${b.first_name} ${b.last_name}`} sub={`${b.service} · ${b.city}`}
                back={{ href: "/studio/bespoke", label: "Back to leads" }}>
        <StatusTag status={b.status} />
      </PageHead>
      <div className="stu-cols">
        <section className="stu-card">
          <header className="stu-card__head"><h3>Lead details</h3></header>
          <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Row label="Phone" value={b.phone} action={<a href={`tel:${b.phone}`} className="stu-link">Call</a>} />
            <Row label="WhatsApp" value="—" action={<a href={`https://wa.me/${b.phone.replace(/\D+/g, "")}`} target="_blank" rel="noreferrer" className="stu-link">Open</a>} />
            <Row label="Email" value={b.email ?? "—"} action={b.email ? <a href={`mailto:${b.email}`} className="stu-link">Email</a> : null} />
            <Row label="City" value={b.city} />
            <Row label="Received" value={dateTime(b.created_at)} />
            {b.message && (
              <div style={{ marginTop: 8, padding: 14, background: "var(--stu-bg)", borderRadius: 10, fontSize: 14 }}>
                &ldquo;{b.message}&rdquo;
              </div>
            )}
          </div>
        </section>
        <BookingControls id={b.id} status={b.status} />
      </div>
    </div>
  );
}

function Row({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--stu-border)", alignItems: "center" }}>
      <span style={{ color: "var(--stu-text-3)", fontSize: 13 }}>{label}</span>
      <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
        {action}
      </span>
    </div>
  );
}
