import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer, getCustomerOrders } from "../../../../lib/admin/repos/customers";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import { rupees, dateShort } from "../../../../lib/admin/format";
import { requireUser } from "../../../../lib/admin/session";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

export default async function CustomerDetailPage({ params }: Params) {
  await requireUser("/studio/login");
  const { id } = await params;
  const c = getCustomer(Number(id));
  if (!c) notFound();
  const orders = getCustomerOrders(c.id);
  return (
    <div className="stu-page">
      <PageHead title={`${c.first_name} ${c.last_name}`} sub={c.email}
                back={{ href: "/studio/customers", label: "Back to customers" }} />
      <div className="stu-cols">
        <section className="stu-card">
          <header className="stu-card__head"><h3>Order history</h3></header>
          <div className="stu-card__body--flush">
            {orders.length === 0 ? (
              <div style={{ padding: 24, color: "var(--stu-text-3)" }}>No orders.</div>
            ) : (
              <div className="stu-tbl-wrap">
                <table className="stu-tbl">
                  <thead><tr><th>Order</th><th>Date</th><th className="stu-tbl__num">Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td><Link href={`/studio/orders/${o.id}`} className="stu-tbl__name" style={{ fontFamily: "ui-monospace, monospace" }}>#{o.id}</Link></td>
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
        </section>
        <section className="stu-card">
          <header className="stu-card__head"><h3>Profile</h3></header>
          <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Row label="Name" value={`${c.first_name} ${c.last_name}`} />
            <Row label="Email" value={c.email} />
            <Row label="Phone" value={c.phone ?? "—"} />
            <Row label="City" value={c.city ?? "—"} />
            <Row label="Joined" value={dateShort(c.created_at)} />
            <Row label="Lifetime spend" value={rupees(c.total_spent)} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--stu-border)" }}>
      <span style={{ color: "var(--stu-text-3)", fontSize: 13 }}>{label}</span>
      <strong style={{ fontSize: 14 }}>{value}</strong>
    </div>
  );
}
