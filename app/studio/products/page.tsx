import Link from "next/link";
import { listProducts, countProducts } from "../../../lib/admin/repos/products";
import { listImagesForSlugs, thumbnailFromImages, fallbackImages } from "../../../lib/admin/repos/product-images";
import { getMetaForSlugs, emptyMeta } from "../../../lib/admin/repos/product-meta";
import { sql } from "../../../lib/admin/db";
import PageHead from "../components/PageHead";
import StatusTag from "../components/StatusTag";
import EmptyState from "../components/EmptyState";
import Folio from "../components/Folio";
import FilterBar, { type Chip } from "../components/FilterBar";
import { FlashToast } from "../components/Toast";
import { rupees } from "../../../lib/admin/format";
import { IconBag, IconPlus, IconStarFill } from "../components/Icons";
import { requireUser } from "../../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products · Studio" };
const PAGE = 20;

type SP = { searchParams: Promise<{ q?: string; status?: string; kind?: string; page?: string; flash?: string }> };

function href(qs: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(qs)) if (v) u.set(k, v);
  return "/studio/products" + (u.toString() ? `?${u}` : "");
}

export default async function ProductsListPage({ searchParams }: SP) {
  await requireUser("/studio/login");
  const sp = await searchParams;
  const q = sp.q;
  const status = (sp.status as "active" | "draft" | "archived" | "all" | undefined) ?? "all";
  const kind = sp.kind === "fabric" ? "fabric" : sp.kind === "tailored" ? "tailored" : undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const items = await listProducts({ q, status, kind, limit: PAGE, offset: (page - 1) * PAGE });
  const slugs = items.map((p) => p.slug);
  const [total, metaMap, imagesMap, stockRows] = await Promise.all([
    countProducts({ q, status, kind }),
    getMetaForSlugs(slugs),
    listImagesForSlugs(slugs),
    slugs.length > 0
      ? sql.all<{ product_slug: string; stock: number }>(
          `SELECT product_slug, stock FROM inventory WHERE product_slug IN (${slugs.map(() => "?").join(",")})`,
          slugs,
        )
      : Promise.resolve([]),
  ]);
  // Group stock by slug
  const stockBySlug = new Map<string, number[]>();
  for (const r of stockRows) {
    let arr = stockBySlug.get(r.product_slug);
    if (!arr) { arr = []; stockBySlug.set(r.product_slug, arr); }
    arr.push(Number(r.stock));
  }
  const rows = items.map((p) => {
    const imgRows = imagesMap.get(p.slug) ?? [];
    const thumb = thumbnailFromImages(imgRows) ?? fallbackImages(p.slug)[0] ?? "";
    const meta = metaMap.get(p.slug) ?? emptyMeta(p.slug);
    const stocks = stockBySlug.get(p.slug) ?? [];
    const totalStock = stocks.reduce((a, s) => a + s, 0);
    const hasOos = stocks.some((s) => s === 0);
    return { p, thumb, meta, totalStock, hasOos };
  });
  const pages = Math.max(1, Math.ceil(total / PAGE));

  const chips: Chip[] = [
    { key: "all", label: "All", active: !sp.status, href: href({ q, kind }) },
    { key: "active", label: "Active", active: status === "active", href: href({ q, kind, status: "active" }) },
    { key: "draft",  label: "Draft",  active: status === "draft",  href: href({ q, kind, status: "draft" }) },
    { key: "archived", label: "Archived", active: status === "archived", href: href({ q, kind, status: "archived" }) },
    { key: "tailored", label: "Tailored", active: kind === "tailored", href: href({ q, status: status === "all" ? undefined : status, kind: "tailored" }) },
    { key: "fabric",   label: "Fabrics",  active: kind === "fabric",   href: href({ q, status: status === "all" ? undefined : status, kind: "fabric" }) },
  ];

  return (
    <div className="stu-page">
      <FlashToast flash={sp.flash} />
      <PageHead
        title="Products"
        sub="Add, edit, and organize every piece in your store. Featured items and new arrivals show up across the homepage."
      >
        <Link href="/studio/products/new" className="stu-btn stu-btn--primary">
          <IconPlus width={16} height={16} /> Add product
        </Link>
      </PageHead>

      <FilterBar chips={chips} placeholder="Search products by name or slug…" />

      <div className="stu-card">
        <div className="stu-card__body--flush">
          {items.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState icon={<IconBag />} title="No products match." body="Try adjusting filters or add a new product."
                          action={<Link href="/studio/products/new" className="stu-btn stu-btn--primary"><IconPlus width={14} height={14}/> New product</Link>} />
            </div>
          ) : (
            <div className="stu-tbl-wrap">
              <table className="stu-tbl">
                <thead>
                  <tr>
                    <th></th>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="stu-tbl__num">Price</th>
                    <th>Flags</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ p, thumb, meta, totalStock, hasOos }) => {
                    return (
                      <tr key={p.slug}>
                        <td style={{ width: 60 }}>
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt="" className="stu-tbl__thumb" />
                          ) : (
                            <div className="stu-tbl__thumb" style={{ display: "grid", placeItems: "center", color: "var(--stu-text-3)" }}>—</div>
                          )}
                        </td>
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
                        <td>
                          <div className="stu-flag-row">
                            {meta.is_featured ? <span className="stu-tag stu-tag--brand stu-tag--bare"><IconStarFill width={11} height={11} /> Featured</span> : null}
                            {meta.is_trending ? <span className="stu-tag stu-tag--info">Trending</span> : null}
                            {meta.is_new_arrival ? <span className="stu-tag stu-tag--success">New</span> : null}
                          </div>
                        </td>
                        <td>
                          {totalStock === 0 ? (
                            <span className="stu-tag stu-tag--danger">Out of stock</span>
                          ) : hasOos ? (
                            <span className="stu-tag stu-tag--warn">Low</span>
                          ) : (
                            <span className="stu-tag stu-tag--success">{totalStock}</span>
                          )}
                        </td>
                        <td><StatusTag status={p.status} /></td>
                        <td><Link href={`/studio/products/${p.slug}`} className="stu-btn stu-btn--ghost stu-btn--sm">Edit</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Folio page={page} pages={pages} total={total} itemLabel="products"
             baseHref={href({ q, status: status === "all" ? undefined : status, kind })} />
    </div>
  );
}
