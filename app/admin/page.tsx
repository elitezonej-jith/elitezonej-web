import Link from "next/link";
import {
  getKpis, getRevenueByDay, getLowStock, getRecentBookings, getTopSkus, getRecentOrders,
} from "../../lib/admin/kpi";
import { requireUser } from "../../lib/admin/session";
import EditorsNote from "./components/EditorsNote";
import KpiTile from "./components/KpiTile";
import Sparkline from "./components/Sparkline";
import StatusPill from "./components/StatusPill";
import SectionRule from "./components/SectionRule";
import EmptyState from "./components/EmptyState";
import { rupees, rupeesShort, dateShort, deltaPct } from "../../lib/admin/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Atelier · Dashboard" };

export default async function DashboardPage() {
  const me = await requireUser();
  const kpis = await getKpis();
  const sparkline = await getRevenueByDay(30);
  const lowStock = await getLowStock(8);
  const bookings = await getRecentBookings(5);
  const top = await getTopSkus(30, 5);
  const orders = await getRecentOrders(6);
  const revDelta = deltaPct(kpis.revenue30d, kpis.revenue30dPrior);
  const noSalesYet = kpis.revenue30d === 0 && kpis.revenue30dPrior === 0;

  return (
    <div className="adm-page">
      <EditorsNote
        body={
          `Welcome back${me ? `, ${me.name.split(" ")[0]}` : ""}. ${
            kpis.bookingsNew > 0
              ? `${kpis.bookingsNew} fresh bespoke ${kpis.bookingsNew === 1 ? "lead awaits" : "leads await"} the first call.`
              : "The bookings inbox is empty — a quiet morning."
          }`
        }
      />

      <header className="adm-page-head">
        <div className="adm-page-head__rule" aria-hidden="true" />
        <div className="adm-page-head__kicker">Workbook · 01</div>
        <div className="adm-page-head__row">
          <h1 className="adm-page-head__title">
            <em>The day,</em> at a glance.
          </h1>
          <div className="adm-page-head__actions">
            <Link href="/admin/orders" className="adm-btn adm-btn--ghost">View orders</Link>
            <Link href="/admin/bespoke" className="adm-btn adm-btn--primary">Bespoke inbox</Link>
          </div>
        </div>
      </header>

      {/* KPI ROW */}
      <section className="adm-kpi-grid">
        <KpiTile
          lead
          kicker="Revenue · last 30"
          value={noSalesYet ? "—" : rupees(kpis.revenue30d)}
          delta={noSalesYet ? undefined : revDelta.delta}
          deltaLabel={noSalesYet ? undefined : `${revDelta.label} vs. prior 30`}
          caption={noSalesYet ? "No sales yet — your first order will appear here." : `${kpis.orders30d} orders · AOV ${rupees(kpis.aov30d)}`}
        >
          <div className="adm-kpi__spark">
            <Sparkline data={sparkline} />
          </div>
        </KpiTile>
        <KpiTile
          kicker="Bespoke · 30d"
          value={kpis.bookings30d}
          caption={kpis.bookingsNew ? `${kpis.bookingsNew} unanswered.` : "Inbox at rest."}
        />
        <KpiTile
          kicker="Catalogue"
          value={kpis.totalActiveSkus}
          caption={`${kpis.lowStockCount} sku${kpis.lowStockCount === 1 ? "" : "s"} approaching empty.`}
        />
      </section>

      <SectionRule kicker="Two columns" title="The atelier floor">
        <Link href="/admin/inventory" className="adm-btn adm-btn--sm adm-btn--ghost">Stock matrix →</Link>
      </SectionRule>

      <div className="adm-cols">
        {/* TOP SKUs */}
        <div className="adm-panel adm-panel--ledger">
          <div className="adm-panel__head">
            <h3>Top pieces · 30 days</h3>
            <span className="adm-panel__head__kicker">By revenue</span>
          </div>
          <div className="adm-tbl-wrap">
            {top.length === 0 ? (
              <div style={{ padding: 24 }}>
                <EmptyState body="No sales yet — the workbook is fresh." />
              </div>
            ) : (
              <table className="adm-tbl">
                <thead>
                  <tr>
                    <th>Piece</th>
                    <th className="adm-tbl__num">Units</th>
                    <th className="adm-tbl__num">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((t) => (
                    <tr key={t.slug}>
                      <td>
                        <Link href={`/admin/products/${t.slug}`} className="adm-tbl__name">{t.name}</Link>
                        <span className="adm-tbl__sub">{t.slug}</span>
                      </td>
                      <td className="adm-tbl__num">{t.units.toFixed(t.units % 1 ? 1 : 0)}</td>
                      <td className="adm-tbl__num adm-tbl__num--accent">{rupeesShort(t.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* LOW STOCK */}
        <div className="adm-panel adm-panel--ledger">
          <div className="adm-panel__head">
            <h3>Approaching empty</h3>
            <span className="adm-panel__head__kicker">Restock</span>
          </div>
          <div className="adm-tbl-wrap">
            {lowStock.length === 0 ? (
              <div style={{ padding: 24 }}>
                <EmptyState body="Every size has breath in it." />
              </div>
            ) : (
              <table className="adm-tbl">
                <thead>
                  <tr>
                    <th>Piece · Size</th>
                    <th className="adm-tbl__num">Stock</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((r, i) => (
                    <tr key={`${r.slug}-${r.size}-${i}`}>
                      <td>
                        <Link href={`/admin/products/${r.slug}`} className="adm-tbl__name">{r.name}</Link>
                        <span className="adm-tbl__sub">{r.size}</span>
                      </td>
                      <td className="adm-tbl__num">{r.stock}</td>
                      <td><StatusPill status="low" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <SectionRule kicker="Inbox" title="Recent bespoke leads">
        <Link href="/admin/bespoke" className="adm-btn adm-btn--sm adm-btn--ghost">All leads →</Link>
      </SectionRule>

      <div className="adm-panel adm-panel--ledger">
        <div className="adm-tbl-wrap">
          {bookings.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState body="No bespoke leads yet. The form on /bespoke is wired to the workbook." />
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
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link href={`/admin/bespoke/${b.id}`} className="adm-tbl__name">
                        {b.first_name} {b.last_name}
                      </Link>
                      <span className="adm-tbl__sub">#BK-{String(b.id).padStart(4,"0")}</span>
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

      <SectionRule kicker="Folio" title="Recent orders">
        <Link href="/admin/orders" className="adm-btn adm-btn--sm adm-btn--ghost">All orders →</Link>
      </SectionRule>

      <div className="adm-panel adm-panel--ledger">
        <div className="adm-tbl-wrap">
          {orders.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState body="No orders yet. The workbook awaits." />
            </div>
          ) : (
            <table className="adm-tbl">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="adm-tbl__num">Total</th>
                  <th>Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="adm-mono">
                      <Link href={`/admin/orders/${o.id}`} className="adm-tbl__name">#{o.id}</Link>
                    </td>
                    <td className="adm-tbl__name" style={{ fontStyle: "italic" }}>{o.customer}</td>
                    <td className="adm-tbl__num">{rupees(o.total)}</td>
                    <td className="adm-mono">{dateShort(o.created_at)}</td>
                    <td><StatusPill status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
