import { notFound } from "next/navigation";
import Link from "next/link";
import { sql } from "../../../../lib/admin/db";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import { FlashToast } from "../../components/Toast";
import CategoryForm from "./CategoryForm";
import FilterEditor from "./FilterEditor";
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

export default async function EditCategoryPage({ params, searchParams }: Params) {
  await requireUser("/studio/login");
  const { id } = await params;
  const { saved } = await searchParams;
  const cat = await sql.get<Cat>("SELECT * FROM categories WHERE id = ?", [Number(id)]);
  if (!cat) notFound();

  // Get all categories for parent dropdown, excluding self and descendants
  const descendantIds = await getDescendantIds(cat.id);
  const excludeIds = [cat.id, ...descendantIds];
  const allCats = await sql.all<{ id: number; name: string; parent_id: number | null }>(
    "SELECT id, name, parent_id FROM categories ORDER BY sort_order ASC",
  );
  const availableParents = allCats.filter((c) => !excludeIds.includes(c.id));

  const filters = await listFiltersForCategory(cat.id);

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
    </div>
  );
}
