import { sql } from "../../../lib/admin/db";
import PageHead from "../components/PageHead";
import { FlashToast } from "../components/Toast";
import { IconBox, IconBag } from "../components/Icons";
import { requireUser } from "../../../lib/admin/session";
import InventoryClient, { type ClothingItem, type FabricItem, type UnifiedItem } from "./InventoryClient";
import { ensureAllProductsTracked } from "../actions/inventory";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory · Studio" };

type SP = { searchParams: Promise<{ flash?: string; q?: string; view?: string; sort?: string; kind?: string }> };
type InvRow = { product_slug: string; size: string; stock: number };
type ProductRow = { slug: string; name: string; kind: string; status: string };
type FabricColourInv = { id: number; product_slug: string; name: string; hex: string; stock_meters: number };

export default async function InventoryPage({ searchParams }: SP) {
  await requireUser("/studio/login");
  const sp = await searchParams;
  const threshold = Number((await sql.get<{ value: string }>("SELECT value FROM settings WHERE key = 'low_stock_threshold'"))?.value ?? "3");

  // ─── Auto-track all untracked products ──────────────────────────────
  await ensureAllProductsTracked();

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

  const clothingRows: ClothingItem[] = tracked.map(p => {
    const sizes = invMap[p.slug] || [];
    const total = sizes.reduce((a, s) => a + s.stock, 0);
    const hasLow = sizes.some(s => s.stock > 0 && s.stock <= threshold);
    const hasOos = sizes.some(s => s.stock === 0);
    const status: "healthy" | "low" | "oos" = hasOos ? "oos" : hasLow ? "low" : "healthy";
    return { _type: "clothing", slug: p.slug, name: p.name, kind: "tailored", sizes, total, hasLow, hasOos, status };
  });

  // ─── Fabric inventory ───────────────────────────────────────────────
  const FABRIC_LOW = 5;
  const fabricProducts = await sql.all<{ slug: string; name: string; status: string }>(
    `SELECT p.slug, p.name, p.status
     FROM products p
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

  const fabricRows: FabricItem[] = fabricProducts.map(p => {
    const colours = fabricColourMap[p.slug] || [];
    const total = colours.reduce((a, c) => a + Number(c.stock_meters), 0);
    const hasLow = colours.some(c => c.stock_meters > 0 && c.stock_meters <= FABRIC_LOW);
    const hasOos = colours.some(c => c.stock_meters === 0);
    const status: "healthy" | "low" | "oos" = hasOos ? "oos" : hasLow ? "low" : "healthy";
    return { _type: "fabric", slug: p.slug, name: p.name, kind: "fabric", colours, total, hasLow, hasOos, status };
  });

  // ─── Unified data (all items, no filtering — client handles it) ─────
  const allItems: UnifiedItem[] = [...clothingRows, ...fabricRows];

  // ─── KPI data ───────────────────────────────────────────────────────
  const totalTracked = allItems.length;
  const totalLow = allItems.filter(r => r.hasLow).length;
  const totalOos = allItems.filter(r => r.hasOos).length;
  const totalUnits = allItems.reduce((a, r) => a + r.total, 0);

  function href(params: Record<string, string | undefined>) {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
    return "/studio/inventory" + (u.toString() ? `?${u}` : "");
  }

  const view = sp.view || "all";

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

      {/* Client-side interactive list (search, filter, sort, density — no page reloads) */}
      <InventoryClient
        items={allItems}
        threshold={threshold}
        fabricLow={FABRIC_LOW}
        totalOos={totalOos}
        totalLow={totalLow}
        initialView={sp.view || "all"}
        initialSort={sp.sort || "name"}
        initialKind={sp.kind || ""}
        initialQuery={sp.q || ""}
      />
    </div>
  );
}
