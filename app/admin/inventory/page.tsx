import Link from "next/link";
import { getStockMatrix } from "../../../lib/admin/repos/products";
import PageHead from "../components/PageHead";
import EditorsNote from "../components/EditorsNote";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";
import { getSetting } from "../../../lib/admin/repos/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory · Atelier" };

type SP = { searchParams: Promise<{ kind?: string }> };

export default async function InventoryPage({ searchParams }: SP) {
  const sp = await searchParams;
  const kind = sp.kind === "fabric" ? "fabric" : "tailored";
  const rows = getStockMatrix({ kind });
  const threshold = Number(getSetting("low_stock_threshold") ?? "3");

  // Build the size column index across the full matrix.
  const sizes = Array.from(
    new Set(rows.flatMap((r) => r.sizes.map((s) => s.size))),
  ).sort((a, b) => {
    const na = Number(a); const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  return (
    <div className="adm-page">
      <EditorsNote
        body={`Cross-SKU stock matrix. ${rows.length} ${kind === "fabric" ? "cloths" : "pieces"} on the floor; the threshold for "low" is ${threshold} units.`}
      />
      <PageHead
        kicker="Workbook · 04"
        emphasis="The stockroom,"
        title="at a glance"
        stand="Every piece, every size, every count. Click a row to step into the piece's editor and revise stock."
      >
        <Link
          href={`/admin/inventory?kind=${kind === "tailored" ? "fabric" : "tailored"}`}
          className="adm-btn adm-btn--ghost"
        >
          {kind === "tailored" ? "View fabrics →" : "View tailored →"}
        </Link>
      </PageHead>

      <div className="adm-panel adm-panel--ledger">
        {rows.length === 0 ? (
          <div style={{ padding: 24 }}>
            <EmptyState body="Nothing to count yet — the catalogue is empty." />
          </div>
        ) : (
          <div className="adm-tbl-wrap">
            <table className="adm-tbl">
              <thead>
                <tr>
                  <th>Piece</th>
                  {sizes.map((s) => (
                    <th key={s} className="adm-tbl__num">{s}</th>
                  ))}
                  <th className="adm-tbl__num">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.slug}>
                    <td>
                      <Link
                        href={kind === "fabric" ? `/admin/fabrics/${r.slug}` : `/admin/products/${r.slug}`}
                        className="adm-tbl__name"
                      >
                        {r.name}
                      </Link>
                      <span className="adm-tbl__sub">{r.slug}</span>
                    </td>
                    {sizes.map((s) => {
                      const cell = r.sizes.find((x) => x.size === s);
                      if (!cell) return (
                        <td key={s} className="adm-tbl__num" style={{ color: "var(--adm-ink-3)" }}>—</td>
                      );
                      const cls = cell.oos
                        ? { color: "var(--adm-paper)", background: "var(--adm-accent)", display: "inline-block", padding: "2px 6px", fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.16em" }
                        : cell.stock <= threshold
                          ? { color: "var(--adm-accent)", fontWeight: 500 }
                          : undefined;
                      return (
                        <td key={s} className="adm-tbl__num">
                          <span style={cls}>{cell.oos ? "OOS" : cell.stock}</span>
                        </td>
                      );
                    })}
                    <td className="adm-tbl__num"><strong>{r.total}</strong></td>
                    <td><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
