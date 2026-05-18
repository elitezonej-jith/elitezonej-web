import Link from "next/link";
import { listProducts, countProducts } from "../../../lib/admin/repos/products";
import PageHead from "../components/PageHead";
import EditorsNote from "../components/EditorsNote";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";
import Folio from "../components/Folio";
import FilterBar, { type FilterChip } from "../components/FilterBar";
import { rupees } from "../../../lib/admin/format";
import { requireUser } from "../../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products · Atelier" };

const PAGE_SIZE = 20;

type SP = { searchParams: Promise<{ q?: string; status?: string; page?: string }> };

function buildHref(qs: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(qs)) if (v) u.set(k, v);
  const s = u.toString();
  return "/admin/products" + (s ? `?${s}` : "");
}

export default async function ProductsListPage({ searchParams }: SP) {
  await requireUser();
  const sp = await searchParams;
  const q = sp.q ?? undefined;
  const status = (sp.status as "active" | "draft" | "archived" | "all" | undefined) ?? "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const items = listProducts({ q, status, kind: "tailored", limit: PAGE_SIZE, offset });
  const total = countProducts({ q, status, kind: "tailored" });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const chips: FilterChip[] = [
    { key: "all", label: "All", active: status === "all" || !sp.status, href: buildHref({ q }) },
    { key: "active", label: "Active", active: status === "active", href: buildHref({ q, status: "active" }) },
    { key: "draft", label: "Draft", active: status === "draft", href: buildHref({ q, status: "draft" }) },
    { key: "archived", label: "Archived", active: status === "archived", href: buildHref({ q, status: "archived" }) },
  ];

  return (
    <div className="adm-page">
      <EditorsNote
        body={`The catalogue holds ${total} tailored ${total === 1 ? "piece" : "pieces"}. The longer it sits in the workbook, the further down it falls — recently revised entries lead.`}
      />
      <PageHead
        kicker="Workbook · 02"
        emphasis="The catalogue,"
        title="entry by entry"
        stand="Each tailored piece is one row in the ledger. Open a row to revise its specs, sizes, copy, and stock. Drafts are visible only inside this workbook."
      >
        <Link href="/admin/fabrics" className="adm-btn adm-btn--ghost">Fabrics →</Link>
        <Link href="/admin/products/new" className="adm-btn adm-btn--primary">New entry</Link>
      </PageHead>

      <FilterBar chips={chips} placeholder="Search by name or slug…" />

      <div className="adm-panel adm-panel--ledger">
        <div className="adm-tbl-wrap">
          {items.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState
                title="No pieces match this filter."
                body="Adjust the search or clear the chips above."
                action={<Link href="/admin/products" className="adm-btn adm-btn--ghost">Clear filters</Link>}
              />
            </div>
          ) : (
            <table className="adm-tbl">
              <thead>
                <tr>
                  <th>Piece</th>
                  <th>Category</th>
                  <th>Gender</th>
                  <th className="adm-tbl__num">Price</th>
                  <th className="adm-tbl__num">Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const stock = p.sizes.length;
                  return (
                    <tr key={p.slug}>
                      <td>
                        <Link href={`/admin/products/${p.slug}`} className="adm-tbl__name">{p.name}</Link>
                        <span className="adm-tbl__sub">{p.slug}</span>
                      </td>
                      <td>
                        <span className="adm-italic">{p.cat || "—"}</span>
                      </td>
                      <td className="adm-mono" style={{ textTransform: "uppercase" }}>{p.gender}</td>
                      <td className="adm-tbl__num">
                        {p.sale_price ? (
                          <>
                            <span className="adm-tbl__strike">{rupees(p.price)}</span>
                            <span className="adm-tbl__num--accent">{rupees(p.sale_price)}</span>
                          </>
                        ) : (
                          rupees(p.price)
                        )}
                      </td>
                      <td className="adm-tbl__num">{stock}</td>
                      <td><StatusPill status={p.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Folio
        page={page}
        pages={pages}
        total={total}
        itemLabel="pieces"
        baseHref={buildHref({ q, status: status === "all" ? undefined : status })}
      />
    </div>
  );
}
