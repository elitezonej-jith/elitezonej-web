import Link from "next/link";
import { listProducts, countProducts } from "../../../lib/admin/repos/products";
import { listFabricColours, getFabricMeta } from "../../../lib/admin/repos/fabrics";
import PageHead from "../components/PageHead";
import EditorsNote from "../components/EditorsNote";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";
import FilterBar, { type FilterChip } from "../components/FilterBar";
import { rupees } from "../../../lib/admin/format";
import { requireUser } from "../../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fabrics · Atelier" };

type SP = { searchParams: Promise<{ q?: string; status?: string }> };
function buildHref(qs: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(qs)) if (v) u.set(k, v);
  const s = u.toString();
  return "/admin/fabrics" + (s ? `?${s}` : "");
}

export default async function FabricsListPage({ searchParams }: SP) {
  await requireUser();
  const sp = await searchParams;
  const q = sp.q ?? undefined;
  const status = (sp.status as "active" | "draft" | "archived" | "all" | undefined) ?? "all";
  const items = await listProducts({ q, status, kind: "fabric", limit: 100 });
  const total = await countProducts({ q, status, kind: "fabric" });
  const rows = await Promise.all(
    items.map(async (p) => ({
      p,
      meta: await getFabricMeta(p.slug),
      colours: await listFabricColours(p.slug),
    })),
  );

  const chips: FilterChip[] = [
    { key: "all", label: "All", active: status === "all" || !sp.status, href: buildHref({ q }) },
    { key: "active", label: "Active", active: status === "active", href: buildHref({ q, status: "active" }) },
    { key: "draft", label: "Draft", active: status === "draft", href: buildHref({ q, status: "draft" }) },
  ];

  return (
    <div className="adm-page">
      <EditorsNote body={`The cloth library — ${total} ${total === 1 ? "fabric" : "fabrics"} sold by the metre. Each row carries colourways, weight, origin, and stock.`} />
      <PageHead
        kicker="Workbook · 03"
        emphasis="The cloth"
        title="library"
        stand="Fabrics are sold by the metre, with one row per colourway and a single record for weight, mill, and care."
      >
        <Link href="/admin/products" className="adm-btn adm-btn--ghost">Tailored →</Link>
        <Link href="/admin/fabrics/new" className="adm-btn adm-btn--primary">New cloth</Link>
      </PageHead>

      <FilterBar chips={chips} placeholder="Search by name or slug…" />

      <div className="adm-panel adm-panel--ledger">
        <div className="adm-tbl-wrap">
          {items.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState body="No cloths in the library yet." />
            </div>
          ) : (
            <table className="adm-tbl">
              <thead>
                <tr>
                  <th>Cloth</th>
                  <th>Colourways</th>
                  <th>Mill / Origin</th>
                  <th className="adm-tbl__num">Per metre</th>
                  <th className="adm-tbl__num">Stock (m)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ p, meta, colours }) => {
                  return (
                    <tr key={p.slug}>
                      <td>
                        <Link href={`/admin/fabrics/${p.slug}`} className="adm-tbl__name">{p.name}</Link>
                        <span className="adm-tbl__sub">{p.slug}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {colours.length === 0 && <span className="adm-italic">No colourways</span>}
                          {colours.map((c) => (
                            <span key={c.id} className="adm-swatch" title={`${c.name} — ${c.stock_meters}m`}>
                              <span className="adm-swatch__chip" style={{ background: c.hex }} aria-hidden="true" />
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="adm-italic">{meta?.origin || "—"}</td>
                      <td className="adm-tbl__num">{rupees(p.price)}</td>
                      <td className="adm-tbl__num">
                        {meta?.stock_meters_total ?? 0}
                      </td>
                      <td><StatusPill status={p.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
