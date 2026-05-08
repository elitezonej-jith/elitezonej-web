import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer, getCustomerOrders } from "../../../../lib/admin/repos/customers";
import PageHead from "../../components/PageHead";
import EditorsNote from "../../components/EditorsNote";
import SectionRule from "../../components/SectionRule";
import StatusPill from "../../components/StatusPill";
import EmptyState from "../../components/EmptyState";
import { rupees, dateShort } from "../../../../lib/admin/format";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

export default async function CustomerDetailPage({ params }: Params) {
  const { id } = await params;
  const customer = getCustomer(Number(id));
  if (!customer) notFound();
  const orders = getCustomerOrders(customer.id);

  return (
    <div className="adm-page">
      <EditorsNote body={`Joined ${dateShort(customer.created_at)} · ${customer.total_orders} orders to date.`} />
      <PageHead
        kicker="Customer record"
        emphasis={customer.first_name}
        title={customer.last_name}
        stand={customer.email}
      >
        <Link href="/admin/customers" className="adm-btn adm-btn--ghost">← All customers</Link>
      </PageHead>

      <div className="adm-cols">
        <div className="adm-stack">
          <SectionRule kicker="History" title="Orders to date" />
          <div className="adm-panel adm-panel--ledger">
            <div className="adm-tbl-wrap">
              {orders.length === 0 ? (
                <div style={{ padding: 24 }}>
                  <EmptyState body="No orders on file for this customer." />
                </div>
              ) : (
                <table className="adm-tbl">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Received</th>
                      <th className="adm-tbl__num">Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="adm-mono"><Link className="adm-tbl__name" href={`/admin/orders/${o.id}`}>#{o.id}</Link></td>
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
        </div>

        <div className="adm-stack">
          <SectionRule kicker="Profile" title="On record" />
          <div className="adm-panel">
            <ul className="adm-bullets">
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Name</span> <span className="adm-italic">{customer.first_name} {customer.last_name}</span></li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Email</span> {customer.email}</li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Phone</span> {customer.phone ?? "—"}</li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>City</span> {customer.city ?? "—"}</li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Joined</span> {dateShort(customer.created_at)}</li>
              <li><span className="adm-mono" style={{ minWidth: 96 }}>Lifetime</span> <span className="adm-tbl__num--accent">{rupees(customer.total_spent)}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
