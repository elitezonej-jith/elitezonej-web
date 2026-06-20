import Link from "next/link";
import { sql } from "../../../lib/admin/db";
import PageHead from "../components/PageHead";
import EmptyState from "../components/EmptyState";
import { FlashToast } from "../components/Toast";
import { IconFolder, IconPlus } from "../components/Icons";
import { requireUser } from "../../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories · Studio" };

type SP = { searchParams: Promise<{ flash?: string }> };

type Cat = {
  id: number; parent_id: number | null; name: string; slug: string;
  gender: string | null; sort_order: number; enabled: number;
};

type FilterCount = { category_id: number; cnt: number };
type ProductCount = { slug: string; cnt: number };

export default async function CategoriesPage({ searchParams }: SP) {
  await requireUser("/studio/login");
  const sp = await searchParams;

  const all = await sql.all<Cat>("SELECT id, parent_id, name, slug, gender, sort_order, enabled FROM categories ORDER BY sort_order ASC, name ASC");
  const filterCounts = await sql.all<FilterCount>("SELECT category_id, COUNT(*) as cnt FROM category_filters GROUP BY category_id");
  const filterMap = Object.fromEntries(filterCounts.map(f => [f.category_id, Number(f.cnt)]));

  // Product counts per category (match on slug or name)
  const productCounts = await sql.all<ProductCount>(
    "SELECT LOWER(TRIM(category)) as slug, COUNT(*) as cnt FROM products WHERE category IS NOT NULL AND TRIM(category) != '' GROUP BY LOWER(TRIM(category))"
  );
  const productMap: Record<string, number> = {};
  for (const p of productCounts) productMap[p.slug] = Number(p.cnt);

  function getProductCount(cat: Cat): number {
    return (productMap[cat.slug] || 0) + (productMap[cat.name.toLowerCase()] || 0);
  }

  function getTreeCount(cat: Cat): number {
    let total = getProductCount(cat);
    const children = all.filter(c => c.parent_id === cat.id);
    for (const child of children) total += getTreeCount(child);
    return total;
  }

  const tops = all.filter(c => c.parent_id === null);

  return (
    <div className="stu-page">
      <FlashToast flash={sp.flash} />
      <PageHead title="Categories" sub="Organize your store navigation. Add subcategories and filters for each.">
        <Link href="/studio/categories/new" className="stu-btn stu-btn--primary">
          <IconPlus width={16} height={16} /> New category
        </Link>
      </PageHead>

      {all.length === 0 ? (
        <EmptyState icon={<IconFolder />} title="No categories yet" body="Create your first category to start organizing the storefront." />
      ) : (
        <div className="cat-tree">
          {tops.map(top => {
            const midLevel = all.filter(c => c.parent_id === top.id);
            return (
              <div key={top.id} className="cat-card cat-card--top">
                <div className="cat-card__header">
                  <div className="cat-card__title">
                    <span className="cat-card__name">{top.name}</span>
                    <span className="cat-card__count">{getTreeCount(top)} products</span>
                  </div>
                  <div className="cat-card__actions">
                    <span className={`cat-card__dot ${top.enabled ? "cat-card__dot--on" : "cat-card__dot--off"}`} title={top.enabled ? "Visible on store" : "Hidden"} />
                    <Link href={`/studio/categories/${top.id}`} className="stu-btn stu-btn--ghost stu-btn--sm">Edit</Link>
                  </div>
                </div>

                {midLevel.length > 0 && (
                  <div className="cat-card__children">
                    {midLevel.map(mid => {
                      const leaves = all.filter(c => c.parent_id === mid.id);
                      const midFilters = filterMap[mid.id] || 0;
                      return (
                        <div key={mid.id} className="cat-card cat-card--mid">
                          <div className="cat-card__header">
                            <div className="cat-card__title">
                              <span className="cat-card__name">{mid.name}</span>
                              <span className="cat-card__count">{getTreeCount(mid)} products</span>
                              {midFilters > 0 && <span className="cat-card__filters">{midFilters} filter{midFilters > 1 ? "s" : ""}</span>}
                            </div>
                            <div className="cat-card__actions">
                              <span className={`cat-card__dot ${mid.enabled ? "cat-card__dot--on" : "cat-card__dot--off"}`} />
                              <Link href={`/studio/categories/${mid.id}`} className="stu-btn stu-btn--ghost stu-btn--sm">Edit</Link>
                            </div>
                          </div>

                          {leaves.length > 0 && (
                            <div className="cat-card__leaves">
                              {leaves.map(leaf => (
                                <div key={leaf.id} className="cat-leaf">
                                  <span className="cat-leaf__name">{leaf.name}</span>
                                  <span className="cat-leaf__count">{getProductCount(leaf)} products</span>
                                  <Link href={`/studio/categories/${leaf.id}`} className="cat-leaf__edit">Edit</Link>
                                </div>
                              ))}
                            </div>
                          )}

                          <Link href={`/studio/categories/new?parent=${mid.id}`} className="cat-card__add">
                            + Add subcategory
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Link href={`/studio/categories/new?parent=${top.id}`} className="cat-card__add">
                  + Add subcategory to {top.name}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
