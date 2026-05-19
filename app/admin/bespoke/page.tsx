import Link from "next/link";
import { listBookings, countBookings } from "../../../lib/admin/repos/bookings";
import PageHead from "../components/PageHead";
import EditorsNote from "../components/EditorsNote";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";
import Folio from "../components/Folio";
import FilterBar, { type FilterChip } from "../components/FilterBar";
import { dateShort } from "../../../lib/admin/format";
import type { BookingStatus } from "../../../lib/admin/types";
import { requireUser } from "../../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bespoke · Atelier" };
const PAGE_SIZE = 20;
const STATUSES: BookingStatus[] = ["new","contacted","scheduled","done","closed"];

type SP = { searchParams: Promise<{ q?: string; status?: string; page?: string }> };
function buildHref(qs: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(qs)) if (v) u.set(k, v);
  const s = u.toString();
  return "/admin/bespoke" + (s ? `?${s}` : "");
}

export default async function BespokeListPage({ searchParams }: SP) {
  await requireUser();
  const sp = await searchParams;
  const q = sp.q;
  const status = sp.status as BookingStatus | undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const items = await listBookings({ q, status, limit: PAGE_SIZE, offset });
  const total = await countBookings({ status });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const chips: FilterChip[] = [
    { key: "all", label: "All", active: !sp.status, href: buildHref({ q }) },
    ...STATUSES.map((s) => ({
      key: s, label: s,
      active: status === s,
      href: buildHref({ q, status: s }),
    } as FilterChip)),
  ];

  return (
    <div className="adm-page">
      <EditorsNote
        body={`The bespoke inbox holds ${total} ${total === 1 ? "lead" : "leads"}. Quick path: open a row, mark contacted, schedule the fitting.`}
      />
      <PageHead
        kicker="Workbook · 07"
        emphasis="Bespoke"
        title="appointments"
        stand="Every public submission lands here. The flow runs new → contacted → scheduled → done."
      />

      <FilterBar chips={chips} placeholder="Search by name, phone, email…" />

      <div className="adm-panel adm-panel--ledger">
        <div className="adm-tbl-wrap">
          {items.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState body="No leads under this filter. The /bespoke form on the storefront is wired to land here." />
            </div>
          ) : (
            <table className="adm-tbl">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>City</th>
                  <th>Service</th>
                  <th>Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link href={`/admin/bespoke/${b.id}`} className="adm-tbl__name">
                        {b.first_name} {b.last_name}
                      </Link>
                      <span className="adm-tbl__sub">{b.phone}{b.email ? ` · ${b.email}` : ""}</span>
                    </td>
                    <td>{b.city}</td>
                    <td>{b.service}</td>
                    <td className="adm-mono">{dateShort(b.created_at)}</td>
                    <td><StatusPill status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Folio page={page} pages={pages} total={total} itemLabel="leads" baseHref={buildHref({ q, status })} />
    </div>
  );
}
