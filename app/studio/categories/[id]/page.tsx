import { notFound } from "next/navigation";
import Link from "next/link";
import { sql } from "../../../../lib/admin/db";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import { FlashToast } from "../../components/Toast";
import CategoryForm from "./CategoryForm";
import FilterEditor from "./FilterEditor";
import ProductMapper from "./ProductMapper";
import { requireUser } from "../../../../lib/admin/session";
import { listFiltersForCategory } from "../../../../lib/admin/repos/category-filters";
import { getDescendantIds } from "../../../../lib/admin/repos/categories";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

type Cat = {
  id: number; parent_id: number | null; name: string; slug: string;
  gender: string | null; kind: string | null; sort_order: number;
  image_path: string; enabled: number;
};

type Prod = { slug: string; name: string; category: string | null; sub: string | null; thumbnail: string | null };

export default async function EditCategoryPage({ params, searchParams }: Params) {
  await requireUser("/studio/login");
  const { id } = await params;
  const { saved } = await searchParams;
  const cat = await sql.get<Cat>("SELECT * FROM categories WHERE id = ?", [Number(id)]);
  if (!cat) notFound();

  const descendantIds = await getDescendantIds(cat.id);
  const excludeIds = [cat.id, ...descendantIds];
  const allCats = await sql.all<{ id: number; name: string; parent_id: number | null }>(
    "SELECT id, name, parent_id FROM categories ORDER BY sort_order ASC",
  );
  const availableParents = allCats.filter((c) => !excludeIds.includes(c.id));

  const filters = await listFiltersForCategory(cat.id);

  // Products mapped to this category (match on slug or sub)
  const mapped = await sql.all<Prod>(
    `SELECT p.slug, p.name, p.category, p.sub,
       (SELECT pi.image_path FROM product_images pi WHERE pi.product_slug = p.slug AND pi.is_thumbnail = 1 LIMIT 1) as thumbnail
     FROM products p
     WHERE LOWER(TRIM(p.sub)) = LOWER(?) OR (LOWER(TRIM(p.category)) = LOWER(?) AND (p.sub IS NULL OR TRIM(p.sub) = '' OR p.sub = '_'))`,
    [cat.slug, cat.slug],
  );

  // Products NOT in this category (available to assign)
  const mappedSlugs = mapped.map(p => p.slug);
  const available = await sql.all<Prod>(
    `SELECT p.slug, p.name, p.category, p.sub,
       (SELECT pi.image_path FROM product_images pi WHERE pi.product_slug = p.slug AND pi.is_thumbnail = 1 LIMIT 1) as thumbnail
     FROM products p WHERE p.status != 'archived' ORDER BY p.name ASC`,
  );
  const assignable = available.filter(p => !mappedSlugs.includes(p.slug));

  return (
    <div className="stu-page stu-page--narrow">
      <FlashToast flash={saved ? "Category saved" : undefined} />
      <PageHead title={cat.name} back={{ href: "/studio/categories", label: "Back to categories" }}>
        <StatusTag status={cat.enabled ? "active" : "disabled"} />
        <Link href="/studio/categories" className="stu-btn stu-btn--ghost">Done</Link>
      </PageHead>
      <CategoryForm tops={availableParents} category={cat} />
      <div style={{ height: 24 }} />
      <FilterEditor categoryId={cat.id} filters={filters} />
      <ProductMapper categoryId={cat.id} categoryName={cat.name} mapped={mapped} available={assignable} />
    </div>
  );
}
