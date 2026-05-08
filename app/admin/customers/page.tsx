import Link from "next/link";
import { listCustomers, countCustomers } from "../../../lib/admin/repos/customers";
import PageHead from "../components/PageHead";
import EditorsNote from "../components/EditorsNote";
import EmptyState from "../components/EmptyState";
import Folio from "../components/Folio";
import FilterBar from "../components/FilterBar";
import { rupees, dateShort } from "../../../lib/admin/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers · Atelier" };
const PAGE_SIZE = 20;

type SP = { searchParams: Promise<{ q?: string; page?: string }> };
function buildHref(qs: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(qs)) if (v) u.set(k, v);
  const s = u.toString();
  return "/admin/customers" + (s ? `?${s}` : "");
}

export default async function CustomersListPage({ searchParams }: SP) {
  const sp = await searchParams;
  const q = sp.q;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const items = listCustomers({ q, limit: PAGE_SIZE, offset });
  const total = countCustomers({ q });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="adm-page">
      <EditorsNote body={`The roll holds ${total} ${total === 1 ? "name" : "names"}. Sorted by lifetime spend, descending.`} />
      <PageHead
        kicker="Workbook · 06"
        emphasis="The roll"
        title="of customers"
        stand="Each row is a single customer record. Open one to see their order history and notes."
      />
      <FilterBar chips={[]} placeholder="Search by name or email…" />
      <div className="adm-panel adm-panel--ledger">
        <div className="adm-tbl-wrap">
          {items.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState body="No customer records yet." />
            </div>
          ) : (
            <table className="adm-tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>City</th>
                  <th className="adm-tbl__num">Orders</th>
                  <th className="adm-tbl__num">Lifetime spend</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/customers/${c.id}`} className="adm-tbl__name">{c.first_name} {c.last_name}</Link>
                    </td>
                    <td className="adm-mono">{c.email}</td>
                    <td>{c.city ?? "—"}</td>
                    <td className="adm-tbl__num">{c.total_orders}</td>
                    <td className="adm-tbl__num adm-tbl__num--accent">{rupees(c.total_spent)}</td>
                    <td className="adm-mono">{dateShort(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Folio page={page} pages={pages} total={total} itemLabel="customers" baseHref={buildHref({ q })} />
    </div>
  );
}
