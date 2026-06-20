import { sql } from "../../../lib/admin/db";
import Link from "next/link";
import PageHead from "../components/PageHead";
import { FlashToast } from "../components/Toast";
import { IconBox, IconBag } from "../components/Icons";
import { requireUser } from "../../../lib/admin/session";
import StockEditor from "./StockEditor";
import StartTracking from "./StartTracking";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory · Studio" };

type SP = { searchParams: Promise<{ flash?: string; q?: string; view?: string; sort?: string; page?: string }> };
type InvRow = { product_slug: string; size: string; stock: number };
type ProductRow = { slug: string; name: string; kind: string; status: string };

export default async function InventoryPage({ searchParams }: SP) {
  await requireUser("/studio/login");
  const sp = await searchParams;
  const threshold = Number((await sql.get<{ value: string }>("SELECT value FROM settings WHERE key = 'low_stock_threshold'"))?.value ?? "3");

  const tracked = await sql.all<ProductRow>(
    `SELECT DISTINCT p.slug, p.name, p.kind, p.status
     FROM products p INNER JOIN inventory i ON i.product_slug = p.slug
     WHERE p.status != 'archived' ORDER BY p.name ASC`
  );
  const allInventory = await sql.all<InvRow>("SELECT product_slug, size, stock FROM inventory");

  const invMap: Record<string, Array<{ size: string; stock: number }>> = {};
  for (const row of allInventory) {
    if (!invMap[row.product_slug]) invMap[row.product_slug] = [];
    invMap[row.product_slug].push({ size: row.size, stock: Number(row.stock) });
  }

  const rows = tracked.map(p => {
    const sizes = invMap[p.slug] || [];
    const total = sizes.reduce((a, s) => a + s.stock, 0);
    const lowest = sizes.length ? Math.min(...sizes.map(s => s.stock)) : 0;
    const hasLow = sizes.some(s => s.stock > 0 && s.stock <= threshold);
    const hasOos = sizes.some(s => s.stock === 0);
    return { ...p, sizes, total, lowest, hasLow, hasOos };
  });

  // Filter
  const view = sp.view || "all";
  let filtered = rows;
  if (view === "low") filtered = rows.filter(r => r.hasLow);
  else if (view === "oos") filtered = rows.filter(r => r.hasOos);
  if (sp.q) {
    const q = sp.q.toLowerCase();
    filtered = filtered.filter(r => r.name.toLowerCase().includes(q));
  }

  // Sort
  const sort = sp.sort || "name";
  if (sort === "lowest") filtered = [...filtered].sort((a, b) => a.lowest - b.lowest);
  else if (sort === "total") filtered = [...filtered].sort((a, b) => a.total - b.total);

  // Pagination
  const PAGE_SIZE = 15;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const lowCount = rows.filter(r => r.hasLow).length;
  const oosCount = rows.filter(r => r.hasOos).length;

  // Untracked products for "Start tracking"
  const untracked = await sql.all<{ slug: string; name: string; kind: string }>(
    `SELECT slug, name, kind FROM products
     WHERE status != 'archived' AND slug NOT IN (SELECT DISTINCT product_slug FROM inventory)
     ORDER BY kind ASC, name ASC LIMIT 50`
  );

  function href(params: Record<string, string | undefined>) {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && v !== "all" && v !== "name") u.set(k, v);
    return "/studio/inventory" + (u.toString() ? `?${u}` : "");
  }

  return (
    <div className="stu-page">
      <FlashToast flash={sp.flash} />
      <PageHead title="Inventory" sub={`${tracked.length} products tracked · Low stock alert: ≤ ${threshold} units`} />

      {/* Summary cards */}
      <div className="inv-summary">
        <a href={href({ view: undefined })} className={`inv-card ${view === "all" ? "inv-card--active" : ""}`}>
          <div className="inv-card__icon"><IconBox width={20} height={20} /></div>
          <div className="inv-card__body">
            <div className="inv-card__num">{rows.length}</div>
            <div className="inv-card__label">Tracked</div>
          </div>
        </a>
        <a href={href({ view: "low" })} className={`inv-card inv-card--warn ${view === "low" ? "inv-card--active" : ""}`}>
          <div className="inv-card__icon inv-card__icon--warn"><IconBag width={20} height={20} /></div>
          <div className="inv-card__body">
            <div className="inv-card__num">{lowCount}</div>
            <div className="inv-card__label">Running low</div>
          </div>
        </a>
        <a href={href({ view: "oos" })} className={`inv-card inv-card--danger ${view === "oos" ? "inv-card--active" : ""}`}>
          <div className="inv-card__icon inv-card__icon--danger"><IconBag width={20} height={20} /></div>
          <div className="inv-card__body">
            <div className="inv-card__num">{oosCount}</div>
            <div className="inv-card__label">Out of stock</div>
          </div>
        </a>
      </div>

      {/* Toolbar: search + sort */}
      <div className="inv-toolbar">
        <form method="GET" action="/studio/inventory" className="inv-toolbar__search">
          {sp.view && sp.view !== "all" && <input type="hidden" name="view" value={sp.view} />}
          {sp.sort && sp.sort !== "name" && <input type="hidden" name="sort" value={sp.sort} />}
          <input name="q" defaultValue={sp.q || ""} className="stu-input" placeholder="Search products…" />
        </form>
        <div className="inv-toolbar__sort">
          <span className="inv-toolbar__label">Sort by</span>
          <a href={href({ view: sp.view, q: sp.q, sort: undefined })} className={`inv-toolbar__chip ${sort === "name" ? "inv-toolbar__chip--on" : ""}`}>Name</a>
          <a href={href({ view: sp.view, q: sp.q, sort: "lowest" })} className={`inv-toolbar__chip ${sort === "lowest" ? "inv-toolbar__chip--on" : ""}`}>Lowest first</a>
          <a href={href({ view: sp.view, q: sp.q, sort: "total" })} className={`inv-toolbar__chip ${sort === "total" ? "inv-toolbar__chip--on" : ""}`}>Total stock</a>
        </div>
      </div>

      {/* Hint */}
      <div className="inv-hint">
        <span className="inv-hint__label">SIZE</span>
        <span className="inv-hint__arrow">→</span>
        <span className="inv-hint__label">QTY</span>
        <span className="inv-hint__note">Click any number to edit. Changes save automatically.</span>
      </div>

      {/* Product list */}
      {paged.length === 0 ? (
        <div className="inv-empty">
          <IconBox width={32} height={32} />
          <p>No products match your filters.</p>
        </div>
      ) : (
        <div className="inv-list">
          {paged.map(row => (
            <div key={row.slug} className={`inv-item ${row.hasOos ? "inv-item--oos" : row.hasLow ? "inv-item--low" : ""}`}>
              <div className="inv-item__head">
                <div className="inv-item__info">
                  <Link href={`/studio/products/${row.slug}`} className="inv-item__name">{row.name}</Link>
                  <span className="inv-item__meta">
                    {row.kind === "fabric" ? "Fabric · by metre" : "Clothing"}
                    {" · "}
                    <Link href={`/products/${row.slug}`} target="_blank" className="inv-item__store-link">View on store ↗</Link>
                  </span>
                </div>
                <span className={`inv-item__status inv-item__status--${row.total === 0 ? "oos" : row.hasLow ? "low" : "ok"}`}>
                  {row.total === 0 ? "Out of stock" : row.hasLow ? `${row.total} units · Restock soon` : `${row.total} units`}
                </span>
              </div>
              <div className="inv-item__sizes">
                {row.sizes.map(s => (
                  <StockEditor key={s.size} slug={row.slug} size={s.size} stock={s.stock} threshold={threshold} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="inv-pages">
          {page > 1 && <a href={href({ view: sp.view, q: sp.q, sort: sp.sort, page: String(page - 1) })} className="stu-btn stu-btn--ghost stu-btn--sm">← Previous</a>}
          <span className="inv-pages__text">Page {page} of {totalPages}</span>
          {page < totalPages && <a href={href({ view: sp.view, q: sp.q, sort: sp.sort, page: String(page + 1) })} className="stu-btn stu-btn--ghost stu-btn--sm">Next →</a>}
        </div>
      )}

      {/* Start tracking section */}
      {untracked.length > 0 && (
        <section className="inv-untracked">
          <h3 className="inv-untracked__title">Start tracking stock</h3>
          <p className="inv-untracked__sub">
            {untracked.filter(p => p.kind !== "fabric").length} clothing products and {untracked.filter(p => p.kind === "fabric").length} fabrics don't have stock tracking yet.
            Fabrics are sold by metre — add metre quantities if you want to track them.
          </p>
          <StartTracking products={untracked} />
        </section>
      )}
    </div>
  );
}
