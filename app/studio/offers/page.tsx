import Link from "next/link";
import { listPromotions } from "../../../lib/admin/repos/promotions";
import PageHead from "../components/PageHead";
import StatusTag from "../components/StatusTag";
import EmptyState from "../components/EmptyState";
import { FlashToast } from "../components/Toast";
import { rupees, dateShort } from "../../../lib/admin/format";
import { IconTag, IconPlus, IconEdit, IconStarFill } from "../components/Icons";
import { sql } from "../../../lib/admin/db";
import { requireUser } from "../../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Offers · Studio" };

type SP = { searchParams: Promise<{ flash?: string }> };

function formatValue(p: { type: string; value: number }) {
  if (p.type === "percent") return `${p.value}% off`;
  if (p.type === "flat") return `${rupees(p.value)} off`;
  return "Free shipping";
}

export default async function OffersPage({ searchParams }: SP) {
  await requireUser("/studio/login");
  const sp = await searchParams;
  const offers = await listPromotions();
  const featuredMap = new Map<string, number>();
  try {
    const rows = await sql.all<{ code: string; is_featured: number }>("SELECT code, is_featured FROM promotions");
    rows.forEach((r) => featuredMap.set(r.code, r.is_featured));
  } catch { /* */ }

  return (
    <div className="stu-page">
      <FlashToast flash={sp.flash} />
      <PageHead title="Offers & coupons"
                sub="Discount codes customers can apply at checkout. Mark one as featured to highlight it on the storefront.">
        <Link href="/studio/offers/new" className="stu-btn stu-btn--primary">
          <IconPlus width={16} height={16}/> New offer
        </Link>
      </PageHead>

      {offers.length === 0 ? (
        <EmptyState icon={<IconTag />} title="No offers yet"
                    body="Create a discount code — pick a percentage, fixed amount, or free shipping."
                    action={<Link href="/studio/offers/new" className="stu-btn stu-btn--primary"><IconPlus width={14} height={14}/> New offer</Link>} />
      ) : (
        <div className="stu-card">
          <div className="stu-card__body--flush">
            <div className="stu-tbl-wrap">
              <table className="stu-tbl">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Min. cart</th>
                    <th>Window</th>
                    <th className="stu-tbl__num">Used</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((p) => {
                    const featured = featuredMap.get(p.code) === 1;
                    return (
                      <tr key={p.code}>
                        <td>
                          <Link href={`/studio/offers/${p.code}`} className="stu-tbl__name" style={{ fontFamily: "ui-monospace, monospace" }}>
                            {featured && <IconStarFill width={12} height={12} style={{ verticalAlign: "middle", color: "var(--stu-brand)", marginRight: 4 }} />}
                            {p.code}
                          </Link>
                          {p.description && <span className="stu-tbl__sub">{p.description}</span>}
                        </td>
                        <td>{formatValue(p)}</td>
                        <td className="stu-tbl__num">{p.min_total ? rupees(p.min_total) : "—"}</td>
                        <td className="stu-tbl__sub" style={{ fontSize: 12 }}>
                          {p.starts_at ? dateShort(p.starts_at) : "—"} → {p.ends_at ? dateShort(p.ends_at) : "open"}
                        </td>
                        <td className="stu-tbl__num">{p.usage_count}{p.usage_limit ? ` / ${p.usage_limit}` : ""}</td>
                        <td><StatusTag status={p.status} /></td>
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

void IconEdit;
