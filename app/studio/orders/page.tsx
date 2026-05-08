import Link from "next/link";
import { listOrders, countOrders } from "../../../lib/admin/repos/orders";
import PageHead from "../components/PageHead";
import StatusTag from "../components/StatusTag";
import EmptyState from "../components/EmptyState";
import Folio from "../components/Folio";
import FilterBar, { type Chip } from "../components/FilterBar";
import { rupees, dateShort } from "../../../lib/admin/format";
import { IconList } from "../components/Icons";
import type { OrderStatus } from "../../../lib/admin/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders · Studio" };
const PAGE = 20;
const STATUSES: OrderStatus[] = ["new","confirmed","in_atelier","shipped","fulfilled","cancelled"];

type SP = { searchParams: Promise<{ q?: string; status?: string; page?: string }> };
function href(qs: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(qs)) if (v) u.set(k, v);
  return "/studio/orders" + (u.toString() ? `?${u}` : "");
}

export default async function OrdersListPage({ searchParams }: SP) {
  const sp = await searchParams;
  const status = sp.status as OrderStatus | undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const items = listOrders({ q: sp.q, status, limit: PAGE, offset: (page - 1) * PAGE });
  const total = countOrders({ q: sp.q, status });
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const chips: Chip[] = [
    { key: "all", label: "All", active: !sp.status, href: href({ q: sp.q }) },
    ...STATUSES.map((s) => ({ key: s, label: s.replace("_", " "), active: status === s, href: href({ q: sp.q, status: s }) })),
  ];
  return (
    <div className="stu-page">
      <PageHead title="Orders" sub="Every customer purchase. Update status, add notes, see what's been bought." />
      <FilterBar chips={chips} placeholder="Search by order id, name, email…" />
      <div className="stu-card">
        <div className="stu-card__body--flush">
          {items.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState icon={<IconList />} title="No orders match" body="Try a different filter." />
            </div>
          ) : (
            <div className="stu-tbl-wrap">
              <table className="stu-tbl">
                <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th className="stu-tbl__num">Total</th><th>Status</th></tr></thead>
                <tbody>
                  {items.map((o) => (
                    <tr key={o.id}>
                      <td><Link href={`/studio/orders/${o.id}`} className="stu-tbl__name" style={{ fontFamily: "ui-monospace, monospace" }}>#{o.id}</Link></td>
                      <td>{o.customer}<span className="stu-tbl__sub">{o.email}</span></td>
                      <td>{dateShort(o.created_at)}</td>
                      <td className="stu-tbl__num">{rupees(o.total)}</td>
                      <td><StatusTag status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Folio page={page} pages={pages} total={total} itemLabel="orders" baseHref={href({ q: sp.q, status })} />
    </div>
  );
}
