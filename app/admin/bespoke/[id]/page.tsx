import Link from "next/link";
import { notFound } from "next/navigation";
import { getBooking } from "../../../../lib/admin/repos/bookings";
import PageHead from "../../components/PageHead";
import EditorsNote from "../../components/EditorsNote";
import SectionRule from "../../components/SectionRule";
import StatusPill from "../../components/StatusPill";
import BookingControls from "./BookingControls";
import { dateTime } from "../../../../lib/admin/format";
import { requireUser } from "../../../../lib/admin/session";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

export default async function BookingDetailPage({ params }: Params) {
  await requireUser();
  const { id } = await params;
  const booking = getBooking(Number(id));
  if (!booking) notFound();

  return (
    <div className="adm-page">
      <EditorsNote body={`Received ${dateTime(booking.created_at)} via the public ${booking.source} form.`} />
      <PageHead
        kicker={`#BK-${String(booking.id).padStart(4,"0")}`}
        emphasis={booking.first_name}
        title={booking.last_name}
        stand={`${booking.service} — ${booking.city}`}
      >
        <Link href="/admin/bespoke" className="adm-btn adm-btn--ghost">← All leads</Link>
        <StatusPill status={booking.status} />
      </PageHead>

      <div className="adm-cols">
        <div className="adm-stack">
          <SectionRule kicker="Lead" title="Contact details" />
          <div className="adm-panel">
            <ul className="adm-bullets">
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Name</span> <span className="adm-italic">{booking.first_name} {booking.last_name}</span></li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Phone</span> {booking.phone}</li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Email</span> {booking.email ?? "—"}</li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>City</span> {booking.city}</li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Service</span> {booking.service}</li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Source</span> {booking.source}</li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Received</span> {dateTime(booking.created_at)}</li>
            </ul>
            {booking.message && (
              <>
                <hr className="adm-hr" />
                <p className="adm-italic" style={{ fontSize: 17, lineHeight: 1.5 }}>
                  &ldquo;{booking.message}&rdquo;
                </p>
              </>
            )}
            <hr className="adm-hr" />
            <div className="adm-btn-row">
              <a className="adm-btn adm-btn--ghost adm-btn--sm" href={`tel:${booking.phone}`}>Call</a>
              <a className="adm-btn adm-btn--ghost adm-btn--sm" href={`https://wa.me/${booking.phone.replace(/\D+/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>
              {booking.email && (
                <a className="adm-btn adm-btn--ghost adm-btn--sm" href={`mailto:${booking.email}`}>Email</a>
              )}
            </div>
          </div>
        </div>

        <div className="adm-stack">
          <SectionRule kicker="Status" title="Move the lead" />
          <BookingControls id={booking.id} status={booking.status} />
        </div>
      </div>
    </div>
  );
}
