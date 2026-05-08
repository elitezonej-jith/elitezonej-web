import Link from "next/link";
import { listOrders, countOrders } from "../../../lib/admin/repos/orders";
import PageHead from "../components/PageHead";
import EditorsNote from "../components/EditorsNote";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";
import Folio from "../components/Folio";
import FilterBar, { type FilterChip } from "../components/FilterBar";
import { rupees, dateShort } from "../../../lib/admin/format";
import type { OrderStatus } from "../../../lib/admin/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders · Atelier" };

const PAGE_SIZE = 20;
const STATUSES: OrderStatus[] = ["new","confirmed","in_atelier","shipped","fulfilled","cancelled"];

type SP = { searchParams: Promise<{ q?: string; status?: string; page?: string }> };

function buildHref(qs: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(qs)) if (v) u.set(k, v);
  const s = u.toString();
  return "/admin/orders" + (s ? `?${s}` : "");
}

export default async function OrdersListPage({ searchParams }: SP) {
  const sp = await searchParams;
  const q = sp.q;
  const status = sp.status as OrderStatus | undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const items = listOrders({ q, status, limit: PAGE_SIZE, offset });
  const total = countOrders({ q, status });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const chips: FilterChip[] = [
    { key: "all", label: "All", active: !sp.status, href: buildHref({ q }) },
    ...STATUSES.map((s) => ({
      key: s, label: s.replace("_", " "),
      active: status === s,
      href: buildHref({ q, status: s }),
      danger: s === "cancelled",
    } as FilterChip)),
  ];

  return (
    <div className="adm-page">
      <EditorsNote body={`The order ledger holds ${total} ${total === 1 ? "entry" : "entries"} matching this filter.`} />
      <PageHead
        kicker="Workbook · 05"
        emphasis="Orders,"
        title="open and closed"
        stand="Each order is one workbook entry — `#WK-####`. Click a row for items, status flow, and customer notes."
      />

      <FilterBar chips={chips} placeholder="Search by order id, name, email…" />

      <div className="adm-panel adm-panel--ledger">
        <div className="adm-tbl-wrap">
          {items.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState body="No orders match this filter." />
            </div>
          ) : (
            <table className="adm-tbl">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Received</th>
                  <th className="adm-tbl__num">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o.id}>
                    <td className="adm-mono">
                      <Link href={`/admin/orders/${o.id}`} className="adm-tbl__name">#{o.id}</Link>
                    </td>
                    <td>
                      <span className="adm-tbl__name" style={{ fontStyle: "italic" }}>{o.customer}</span>
                      <span className="adm-tbl__sub">{o.email}</span>
                    </td>
                    <td className="adm-mono">{dateShort(o.created_at)}</td>
                    <td className="adm-tbl__num">{rupees(o.total)}</td>
                    <td><StatusPill status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Folio
        page={page}
        pages={pages}
        total={total}
        itemLabel="orders"
        baseHref={buildHref({ q, status })}
      />
    </div>
  );
}
