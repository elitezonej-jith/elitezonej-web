import Link from "next/link";
import { listFlashSales } from "../../../lib/admin/repos/flash-sales";
import PageHead from "../components/PageHead";
import EmptyState from "../components/EmptyState";
import StatusTag from "../components/StatusTag";
import { FlashToast } from "../components/Toast";
import { dateTime } from "../../../lib/admin/format";
import { IconBolt, IconPlus, IconEdit } from "../components/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Flash sales · Studio" };

type SP = { searchParams: Promise<{ flash?: string }> };

export default async function FlashSalesPage({ searchParams }: SP) {
  const sp = await searchParams;
  const sales = listFlashSales();
  const now = Date.now();
  return (
    <div className="stu-page">
      <FlashToast flash={sp.flash} />
      <PageHead title="Flash sales"
                sub="Time-bound promotions that show a countdown banner across the storefront. Tie one to a discount code for instant savings.">
        <Link href="/studio/flash-sales/new" className="stu-btn stu-btn--primary">
          <IconPlus width={16} height={16}/> New flash sale
        </Link>
      </PageHead>

      {sales.length === 0 ? (
        <EmptyState icon={<IconBolt />} title="No flash sales yet"
                    body="Create one to add a countdown banner with a discount code."
                    action={<Link href="/studio/flash-sales/new" className="stu-btn stu-btn--primary"><IconPlus width={14} height={14}/> New flash sale</Link>} />
      ) : (
        <div className="stu-card">
          <div className="stu-card__body--flush">
            <div className="stu-tbl-wrap">
              <table className="stu-tbl">
                <thead><tr><th>Title</th><th>Code</th><th>Window</th><th>State</th><th></th></tr></thead>
                <tbody>
                  {sales.map((s) => {
                    const ended = s.ends_at && new Date(s.ends_at).getTime() < now;
                    return (
                      <tr key={s.id}>
                        <td>
                          <Link href={`/studio/flash-sales/${s.id}`} className="stu-tbl__name">{s.title}</Link>
                          {s.subtitle && <span className="stu-tbl__sub">{s.subtitle}</span>}
                        </td>
                        <td className="stu-tbl__sub" style={{ fontFamily: "ui-monospace, monospace" }}>{s.promo_code ?? "—"}</td>
                        <td className="stu-tbl__sub" style={{ fontSize: 12 }}>
                          {s.starts_at ? dateTime(s.starts_at) : "Now"} → {dateTime(s.ends_at)}
                        </td>
                        <td><StatusTag status={ended ? "expired" : (s.enabled ? "active" : "disabled")} /></td>
                        <td><Link href={`/studio/flash-sales/${s.id}`} className="stu-btn stu-btn--ghost stu-btn--sm"><IconEdit width={14} height={14}/> Edit</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
