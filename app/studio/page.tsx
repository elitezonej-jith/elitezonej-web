import Link from "next/link";
import { getKpis, getRevenueByDay, getRecentBookings, getRecentOrders } from "../../lib/admin/kpi";
import { listProducts } from "../../lib/admin/repos/products";
import { listBanners } from "../../lib/admin/repos/banners";
import { listNotices } from "../../lib/admin/repos/notices";
import { listPromotions } from "../../lib/admin/repos/promotions";
import PageHead from "./components/PageHead";
import StatusTag from "./components/StatusTag";
import { rupees, rupeesShort, dateShort, deltaPct } from "../../lib/admin/format";
import {
  IconBag, IconCart, IconScissors, IconTag, IconImage, IconLayers, IconBell, IconSparkles, IconArrowRight, IconPlus,
} from "./components/Icons";
import { requireUser } from "../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard · Studio" };

export default async function StudioDashboardPage() {
  await requireUser("/studio/login");
  const kpis = await getKpis();
  const revDelta = deltaPct(kpis.revenue30d, kpis.revenue30dPrior);
  const noSalesYet = kpis.revenue30d === 0 && kpis.revenue30dPrior === 0;
  const recentProducts = await listProducts({ status: "all", limit: 6 });
  const banners = await listBanners();
  const notices = (await listNotices()).slice(0, 3);
  const offers = (await listPromotions()).slice(0, 3);
  const recentBookings = await getRecentBookings(4);
  const recentOrders = await getRecentOrders(4);
  const sparkline = await getRevenueByDay(30);
  const sparkSum = sparkline.reduce((a, p) => a + p.total, 0);
  void sparkSum;

  return (
    <div className="stu-page">
      <PageHead
        title="Dashboard"
        sub="Welcome to your studio. Here's what's happening across the storefront today."
      >
        <Link href="/studio/products/new" className="stu-btn stu-btn--primary">
          <IconPlus width={16} height={16} /> Add product
        </Link>
      </PageHead>

      {/* Stats */}
      <div className="stu-stat-grid">
        <Stat icon={<IconCart />} label="Revenue · 30 days" value={noSalesYet ? "—" : rupees(kpis.revenue30d)}
              delta={noSalesYet ? "No sales yet" : `${revDelta.label} vs. previous 30`} dir={noSalesYet ? "flat" : revDelta.delta} />
        <Stat icon={<IconBag />}  label="Orders · 30 days" value={String(kpis.orders30d)}
              delta={`AOV ${rupees(kpis.aov30d)}`} />
        <Stat icon={<IconScissors />} label="Bespoke leads"  value={String(kpis.bookingsNew)}
              delta={`${kpis.bookings30d} this month`} />
        <Stat icon={<IconBag />} label="Active products" value={String(kpis.totalActiveSkus)}
              delta={`${kpis.lowStockCount} low on stock`} dir={kpis.lowStockCount > 0 ? "down" : "flat"} />
      </div>

      <h2 className="stu-section-title" style={{ marginTop: 32 }}>Quick actions</h2>
      <div className="stu-quick-grid">
        <Quick href="/studio/products/new" icon={<IconBag />} title="Add a product"
               sub="Create a new piece, upload images, set price." />
        <Quick href="/studio/banners/new" icon={<IconImage />} title="New banner"
               sub="Hero image with title, subtitle, button." />
        <Quick href="/studio/notices/new" icon={<IconBell />} title="Post a notice"
               sub="Scrolling ticker, popup, or festive banner." />
        <Quick href="/studio/offers/new" icon={<IconTag />} title="Create offer"
               sub="Discount code, applied to anything." />
        <Quick href="/studio/flash-sales/new" icon={<IconSparkles />} title="Flash sale"
               sub="Countdown banner with code." />
        <Quick href="/studio/homepage" icon={<IconLayers />} title="Edit homepage"
               sub="Reorder, add or remove sections." />
      </div>

      <div className="stu-cols" style={{ marginTop: 32 }}>
        <div className="stu-stack">
          <section className="stu-card">
            <header className="stu-card__head">
              <h3>Recently added products</h3>
              <Link href="/studio/products" className="stu-link">View all <IconArrowRight width={12} height={12} style={{ verticalAlign: "middle" }} /></Link>
            </header>
            <div className="stu-card__body--flush">
              <div className="stu-tbl-wrap">
                <table className="stu-tbl">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th className="stu-tbl__num">Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProducts.map((p) => (
                      <tr key={p.slug}>
                        <td>
                          <Link href={`/studio/products/${p.slug}`} className="stu-tbl__name">{p.name}</Link>
                          <span className="stu-tbl__sub">{p.slug}</span>
                        </td>
                        <td>{p.cat || "—"}</td>
                        <td className="stu-tbl__num">
                          {p.sale_price ? (
                            <>
                              <span className="stu-tbl__strike">{rupees(p.price)}</span>
                              {rupees(p.sale_price)}
                            </>
                          ) : rupees(p.price)}
                        </td>
                        <td><StatusTag status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="stu-card">
            <header className="stu-card__head">
              <h3>Recent orders</h3>
              <Link href="/studio/orders" className="stu-link">View all <IconArrowRight width={12} height={12} style={{ verticalAlign: "middle" }} /></Link>
            </header>
            <div className="stu-card__body--flush">
              <div className="stu-tbl-wrap">
                <table className="stu-tbl">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th className="stu-tbl__num">Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td><Link href={`/studio/orders/${o.id}`} className="stu-tbl__name">#{o.id}</Link></td>
                        <td>{o.customer}<span className="stu-tbl__sub">{dateShort(o.created_at)}</span></td>
                        <td className="stu-tbl__num">{rupees(o.total)}</td>
                        <td><StatusTag status={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <div className="stu-stack">
          <section className="stu-card">
            <header className="stu-card__head">
              <h3>Bespoke inbox</h3>
              <Link href="/studio/bespoke" className="stu-link">View all</Link>
            </header>
            <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {recentBookings.length === 0 && (
                <span style={{ color: "var(--stu-text-3)", fontSize: 13.5 }}>No leads yet.</span>
              )}
              {recentBookings.map((b) => (
                <Link key={b.id} href={`/studio/bespoke/${b.id}`}
                      style={{ display: "flex", flexDirection: "column", gap: 4, textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{b.first_name} {b.last_name}</strong>
                    <StatusTag status={b.status} />
                  </div>
                  <span style={{ fontSize: 12.5, color: "var(--stu-text-3)" }}>
                    {b.service} · {b.city} · {dateShort(b.created_at)}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="stu-card">
            <header className="stu-card__head">
              <h3>Storefront state</h3>
            </header>
            <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Row label="Banners published" value={String(banners.filter((b) => b.status === "published" && b.enabled).length)} sub={`${banners.length} total`} href="/studio/banners" />
              <Row label="Notices live" value={String(notices.filter((n) => n.enabled).length)} sub={`${notices.length} total`} href="/studio/notices" />
              <Row label="Offers active" value={String(offers.filter((o) => o.status === "active").length)} sub={`${offers.length} total`} href="/studio/offers" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, delta, dir }: {
  icon: React.ReactNode; label: string; value: string;
  delta?: string; dir?: "up" | "down" | "flat";
}) {
  return (
    <div className="stu-stat">
      <div className="stu-stat__row">
        <span className="stu-stat__icon">{icon}</span>
        <span className="stu-stat__label">{label}</span>
      </div>
      <span className="stu-stat__value">{value}</span>
      {delta && <span className={`stu-stat__delta ${dir ?? ""}`}>{delta}</span>}
    </div>
  );
}

function Quick({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link href={href} className="stu-quick">
      <span className="stu-quick__icon">{icon}</span>
      <span className="stu-quick__title">{title}</span>
      <span className="stu-quick__sub">{sub}</span>
    </Link>
  );
}

function Row({ label, value, sub, href }: { label: string; value: string; sub: string; href: string }) {
  return (
    <Link href={href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit", padding: "6px 0" }}>
      <span>
        <span style={{ fontWeight: 600, fontSize: 14, display: "block" }}>{label}</span>
        <span style={{ fontSize: 12.5, color: "var(--stu-text-3)" }}>{sub}</span>
      </span>
      <span style={{ fontSize: 22, fontWeight: 700 }}>{value}</span>
    </Link>
  );
}

void rupeesShort;
