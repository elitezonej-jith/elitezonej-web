import Link from "next/link";
import { listCustomers, countCustomers } from "../../../lib/admin/repos/customers";
import PageHead from "../components/PageHead";
import EmptyState from "../components/EmptyState";
import Folio from "../components/Folio";
import FilterBar from "../components/FilterBar";
import { rupees, dateShort } from "../../../lib/admin/format";
import { IconUser } from "../components/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers · Studio" };
const PAGE = 20;

type SP = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function CustomersListPage({ searchParams }: SP) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const items = listCustomers({ q: sp.q, limit: PAGE, offset: (page - 1) * PAGE });
  const total = countCustomers({ q: sp.q });
  const pages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <div className="stu-page">
      <PageHead title="Customers" sub="Everyone who's bought from you. Sorted by lifetime spend." />
      <FilterBar chips={[]} placeholder="Search by name or email…" />
      <div className="stu-card">
        <div className="stu-card__body--flush">
          {items.length === 0 ? (
            <div style={{ padding: 24 }}><EmptyState icon={<IconUser />} title="No customers yet" /></div>
          ) : (
            <div className="stu-tbl-wrap">
              <table className="stu-tbl">
                <thead><tr><th>Name</th><th>Email</th><th>City</th><th className="stu-tbl__num">Orders</th><th className="stu-tbl__num">Lifetime</th><th>Joined</th></tr></thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id}>
                      <td><Link href={`/studio/customers/${c.id}`} className="stu-tbl__name">{c.first_name} {c.last_name}</Link></td>
                      <td>{c.email}</td>
                      <td>{c.city ?? "—"}</td>
                      <td className="stu-tbl__num">{c.total_orders}</td>
                      <td className="stu-tbl__num">{rupees(c.total_spent)}</td>
                      <td>{dateShort(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Folio page={page} pages={pages} total={total} itemLabel="customers" baseHref="/studio/customers" />
    </div>
  );
}
