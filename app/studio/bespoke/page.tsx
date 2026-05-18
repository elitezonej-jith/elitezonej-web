import Link from "next/link";
import { listBookings, countBookings } from "../../../lib/admin/repos/bookings";
import PageHead from "../components/PageHead";
import StatusTag from "../components/StatusTag";
import EmptyState from "../components/EmptyState";
import Folio from "../components/Folio";
import FilterBar, { type Chip } from "../components/FilterBar";
import { dateShort } from "../../../lib/admin/format";
import { IconScissors } from "../components/Icons";
import type { BookingStatus } from "../../../lib/admin/types";
import { requireUser } from "../../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bespoke leads · Studio" };
const PAGE = 20;
const STATUSES: BookingStatus[] = ["new", "contacted", "scheduled", "done", "closed"];

type SP = { searchParams: Promise<{ q?: string; status?: string; page?: string }> };
function href(qs: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(qs)) if (v) u.set(k, v);
  return "/studio/bespoke" + (u.toString() ? `?${u}` : "");
}

export default async function BespokePage({ searchParams }: SP) {
  await requireUser("/studio/login");
  const sp = await searchParams;
  const status = sp.status as BookingStatus | undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const items = listBookings({ q: sp.q, status, limit: PAGE, offset: (page - 1) * PAGE });
  const total = countBookings({ status });
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const chips: Chip[] = [
    { key: "all", label: "All", active: !sp.status, href: href({ q: sp.q }) },
    ...STATUSES.map((s) => ({ key: s, label: s, active: status === s, href: href({ q: sp.q, status: s }) })),
  ];
  return (
    <div className="stu-page">
      <PageHead title="Bespoke leads" sub="Customers who submitted the bespoke form. Move each through the funnel." />
      <FilterBar chips={chips} placeholder="Search by name, phone, email…" />
      <div className="stu-card">
        <div className="stu-card__body--flush">
          {items.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState icon={<IconScissors />} title="No leads under this filter"
                          body="Submissions from your /bespoke form land here." />
            </div>
          ) : (
            <div className="stu-tbl-wrap">
              <table className="stu-tbl">
                <thead><tr><th>Lead</th><th>City</th><th>Service</th><th>Received</th><th>Status</th></tr></thead>
                <tbody>
                  {items.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <Link href={`/studio/bespoke/${b.id}`} className="stu-tbl__name">{b.first_name} {b.last_name}</Link>
                        <span className="stu-tbl__sub">{b.phone}{b.email ? ` · ${b.email}` : ""}</span>
                      </td>
                      <td>{b.city}</td>
                      <td>{b.service}</td>
                      <td>{dateShort(b.created_at)}</td>
                      <td><StatusTag status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Folio page={page} pages={pages} total={total} itemLabel="leads" baseHref={href({ q: sp.q, status })} />
    </div>
  );
}
