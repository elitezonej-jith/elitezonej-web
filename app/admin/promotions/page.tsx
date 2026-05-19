import Link from "next/link";
import { listPromotions } from "../../../lib/admin/repos/promotions";
import PageHead from "../components/PageHead";
import EditorsNote from "../components/EditorsNote";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";
import { rupees, dateShort } from "../../../lib/admin/format";
import { requireUser } from "../../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promotions · Atelier" };

function formatValue(p: { type: string; value: number }) {
  if (p.type === "percent") return `${p.value}% off`;
  if (p.type === "flat") return `${rupees(p.value)} off`;
  return "Free ship";
}

export default async function PromotionsPage() {
  await requireUser();
  const promos = await listPromotions();
  return (
    <div className="adm-page">
      <EditorsNote body={`The promotions ledger has ${promos.length} ${promos.length === 1 ? "code" : "codes"}. Active codes apply at the cart.`} />
      <PageHead
        kicker="Workbook · 10"
        emphasis="Promotions"
        title="& gifts"
        stand="Discount codes the bespoke desk hands out, plus seasonal site-wide offers. Each entry is a single code."
      >
        <Link href="/admin/promotions/new" className="adm-btn adm-btn--primary">New promotion</Link>
      </PageHead>

      <div className="adm-panel adm-panel--ledger">
        <div className="adm-tbl-wrap">
          {promos.length === 0 ? (
            <div style={{ padding: 24 }}><EmptyState body="No promotions inscribed yet." /></div>
          ) : (
            <table className="adm-tbl">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min. cart</th>
                  <th>Window</th>
                  <th className="adm-tbl__num">Used</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.code}>
                    <td className="adm-mono">
                      <Link href={`/admin/promotions/${p.code}`} className="adm-tbl__name">{p.code}</Link>
                      {p.description && <span className="adm-tbl__sub">{p.description}</span>}
                    </td>
                    <td className="adm-italic">{formatValue(p)}</td>
                    <td className="adm-tbl__num">{p.min_total ? rupees(p.min_total) : "—"}</td>
                    <td className="adm-mono" style={{ fontSize: 11 }}>
                      {p.starts_at ? dateShort(p.starts_at) : "—"} → {p.ends_at ? dateShort(p.ends_at) : "open"}
                    </td>
                    <td className="adm-tbl__num">{p.usage_count}{p.usage_limit ? ` / ${p.usage_limit}` : ""}</td>
                    <td><StatusPill status={p.status} /></td>
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
