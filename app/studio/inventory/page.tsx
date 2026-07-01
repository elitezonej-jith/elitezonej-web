import { sql } from "../../../lib/admin/db";
import Link from "next/link";
import PageHead from "../components/PageHead";
import { FlashToast } from "../components/Toast";
import { IconBox, IconBag } from "../components/Icons";
import { requireUser } from "../../../lib/admin/session";
import Toolbar from "./Toolbar";
import InventoryCard from "./InventoryCard";
import StockCell from "./StockCell";
import FabricCell from "./FabricCell";
import StartTracking from "./StartTracking";
import InventoryClient from "./InventoryClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory · Studio" };

type SP = { searchParams: Promise<{ flash?: string; q?: string; view?: string; sort?: string; page?: string; kind?: string }> };
type InvRow = { product_slug: string; size: string; stock: number };
type ProductRow = { slug: string; name: string; kind: string; status: string };
type FabricColourInv = { id: number; product_slug: string; name: string; hex: string; stock_meters: number };

export default async function InventoryPage({ searchParams }: SP) {
  await requireUser("/studio/login");
  const sp = await searchParams;
  const threshold = Number((await sql.get<{ value: string }>("SELECT value FROM settings WHERE key = 'low_stock_threshold'"))?.value ?? "3");

  // ─── Clothing inventory ─────────────────────────────────────────────
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

  const clothingRows = tracked.map(p => {
    const sizes = invMap[p.slug] || [];
    const total = sizes.reduce((a, s) => a + s.stock, 0);
    const lowest = sizes.length ? Math.min(...sizes.map(s => s.stock)) : 0;
    const hasLow = sizes.some(s => s.stock > 0 && s.stock <= threshold);
    const hasOos = sizes.some(s => s.stock === 0);
    const status: "healthy" | "low" | "oos" = hasOos ? "oos" : hasLow ? "low" : "healthy";
    return { ...p, kind: "tailored" as const, sizes, total, lowest, hasLow, hasOos, status };
  });

  // ─── Fabric inventory ───────────────────────────────────────────────
  const FABRIC_LOW = 5;
  const fabricProducts = await sql.all<{ slug: string; name: string; status: string; stock_meters_total: number }>(
    `SELECT p.slug, p.name, p.status, COALESCE(fm.stock_meters_total, 0) as stock_meters_total
     FROM products p
     LEFT JOIN fabric_meta fm ON fm.product_slug = p.slug
     WHERE p.kind = 'fabric' AND p.status != 'archived'
     AND p.slug IN (SELECT DISTINCT product_slug FROM fabric_colours)
     ORDER BY p.name ASC`
  );
  const allFabricColours = await sql.all<FabricColourInv>(
    "SELECT id, product_slug, name, hex, stock_meters FROM fabric_colours ORDER BY sort_order ASC, name ASC"
  );
  const fabricColourMap: Record<string, FabricColourInv[]> = {};
  for (const c of allFabricColours) {
    if (!fabricColourMap[c.product_slug]) fabricColourMap[c.product_slug] = [];
    fabricColourMap[c.product_slug].push(c);
  }

  const fabricRows = fabricProducts.map(p => {
    const colours = fabricColourMap[p.slug] || [];
    const total = colours.reduce((a, c) => a + Number(c.stock_meters), 0);
    const hasLow = colours.some(c => c.stock_meters > 0 && c.stock_meters <= FABRIC_LOW);
    const hasOos = colours.some(c => c.stock_meters === 0);
    const status: "healthy" | "low" | "oos" = hasOos ? "oos" : hasLow ? "low" : "healthy";
    return { ...p, kind: "fabric" as const, colours, total, hasLow, hasOos, status };
  });

  // ─── Unified list ───────────────────────────────────────────────────
  type UnifiedRow =
    | (typeof clothingRows[number] & { _type: "clothing" })
    | (typeof fabricRows[number] & { _type: "fabric" });

  let unified: UnifiedRow[] = [
    ...clothingRows.map(r => ({ ...r, _type: "clothing" as const })),
    ...fabricRows.map(r => ({ ...r, _type: "fabric" as const })),
  ];

  // ─── Filters ────────────────────────────────────────────────────────
  const view = sp.view || "all";
  const kindFilter = sp.kind || "";

  if (view === "low") unified = unified.filter(r => r.hasLow);
  else if (view === "oos") unified = unified.filter(r => r.hasOos);

  if (kindFilter === "tailored") unified = unified.filter(r => r._type === "clothing");
  else if (kindFilter === "fabric") unified = unified.filter(r => r._type === "fabric");

  if (sp.q) {
    const q = sp.q.toLowerCase();
    unified = unified.filter(r => r.name.toLowerCase().includes(q));
  }

  // ─── Sort ───────────────────────────────────────────────────────────
  const sort = sp.sort || "name";
  if (sort === "name") unified.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "lowest") unified.sort((a, b) => {
    const aMin = a._type === "clothing" ? (a.sizes.length ? Math.min(...a.sizes.map(s => s.stock)) : 0) : a.total;
    const bMin = b._type === "clothing" ? (b.sizes.length ? Math.min(...b.sizes.map(s => s.stock)) : 0) : b.total;
    return aMin - bMin;
  });
  else if (sort === "total") unified.sort((a, b) => a.total - b.total);

  // ─── Pagination ─────────────────────────────────────────────────────
  const PAGE_SIZE = 20;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const totalItems = unified.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paged = unified.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ─── KPI data ───────────────────────────────────────────────────────
  const totalTracked = clothingRows.length + fabricRows.length;
  const totalLow = clothingRows.filter(r => r.hasLow).length + fabricRows.filter(r => r.hasLow).length;
  const totalOos = clothingRows.filter(r => r.hasOos).length + fabricRows.filter(r => r.hasOos).length;
  const totalUnits = clothingRows.reduce((a, r) => a + r.total, 0) + fabricRows.reduce((a, r) => a + r.total, 0);

  // ─── Untracked ──────────────────────────────────────────────────────
  const untracked = await sql.all<{ slug: string; name: string; kind: string }>(
    `SELECT slug, name, kind FROM products
     WHERE status != 'archived'
       AND slug NOT IN (SELECT DISTINCT product_slug FROM inventory)
       AND slug NOT IN (SELECT DISTINCT product_slug FROM fabric_colours)
     ORDER BY kind ASC, name ASC LIMIT 50`
  );

  function href(params: Record<string, string | undefined>) {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
    return "/studio/inventory" + (u.toString() ? `?${u}` : "");
  }

  return (
    <div className="stu-page inv2">
      <FlashToast flash={sp.flash} />
      <PageHead title="Inventory" sub={`${totalTracked} products tracked`} />

      {/* KPI Bar */}
      <div className="inv2-kpi">
        <a href={href({})} className={`inv2-kpi__card ${view === "all" || !view ? "inv2-kpi__card--active" : ""}`}>
          <div className="inv2-kpi__icon"><IconBox width={16} height={16} /></div>
          <div className="inv2-kpi__body">
            <span className="inv2-kpi__label">Tracked</span>
            <span className="inv2-kpi__num">{totalTracked}</span>
          </div>
        </a>
        <a href={href({ view: "low" })} className={`inv2-kpi__card inv2-kpi__card--warn ${view === "low" ? "inv2-kpi__card--active" : ""}`}>
          <div className="inv2-kpi__icon"><IconBag width={16} height={16} /></div>
          <div className="inv2-kpi__body">
            <span className="inv2-kpi__label">Low stock</span>
            <span className="inv2-kpi__num">{totalLow}</span>
          </div>
        </a>
        <a href={href({ view: "oos" })} className={`inv2-kpi__card inv2-kpi__card--danger ${view === "oos" ? "inv2-kpi__card--active" : ""}`}>
          <div className="inv2-kpi__icon"><IconBag width={16} height={16} /></div>
          <div className="inv2-kpi__body">
            <span className="inv2-kpi__label">Out of stock</span>
            <span className="inv2-kpi__num">{totalOos}</span>
          </div>
        </a>
        <div className="inv2-kpi__card">
          <div className="inv2-kpi__body">
            <span className="inv2-kpi__label">Total units</span>
            <span className="inv2-kpi__num">{totalUnits.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        query={sp.q || ""}
        view={view}
        sort={sort}
        kind={kindFilter}
        total={totalItems}
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
      />

      {/* Unified Product List with Undo */}
      <InventoryClient threshold={threshold} fabricLow={FABRIC_LOW}>
        {paged.length === 0 ? (
          <div className="inv2-empty">
            <IconBox width={32} height={32} />
            <p className="inv2-empty__title">No products match your filters</p>
            <p className="inv2-empty__sub">Try adjusting your search or filter criteria</p>
            <a href="/studio/inventory" className="stu-btn stu-btn--ghost stu-btn--sm">Reset filters</a>
          </div>
        ) : (
          <div className="inv2-list">
            {paged.map(row => {
              if (row._type === "clothing") {
                return (
                  <InventoryCard
                    key={row.slug}
                    slug={row.slug}
                    name={row.name}
                    kind="tailored"
                    status={row.status}
                    total={row.total}
                    unit="units"
                  >
                    {row.sizes.map(s => (
                      <StockCell
                        key={s.size}
                        slug={row.slug}
                        size={s.size}
                        stock={s.stock}
                        threshold={threshold}
                      />
                    ))}
                  </InventoryCard>
                );
              } else {
                return (
                  <InventoryCard
                    key={row.slug}
                    slug={row.slug}
                    name={row.name}
                    kind="fabric"
                    status={row.status}
                    total={row.total}
                    unit="m"
                    colourCount={row.colours.length}
                  >
                    {row.colours.map(c => (
                      <FabricCell
                        key={c.id}
                        slug={row.slug}
                        colourId={c.id}
                        colourName={c.name}
                        hex={c.hex}
                        stockMeters={c.stock_meters}
                      />
                    ))}
                  </InventoryCard>
                );
              }
            })}
          </div>
        )}
      </InventoryClient>

      {/* Untracked products (collapsed) */}
      {untracked.length > 0 && (
        <details className="inv2-untracked">
          <summary className="inv2-untracked__summary">
            <span>{untracked.length} products not tracked yet</span>
            <span className="inv2-untracked__cta">Set up →</span>
          </summary>
          <div className="inv2-untracked__body">
            <StartTracking products={untracked} />
          </div>
        </details>
      )}
    </div>
  );
}
