import Link from "next/link";
import { sql } from "../../../../lib/admin/db";
import PageHead from "../../components/PageHead";
import CategoryForm from "../[id]/CategoryForm";
import { requireUser } from "../../../../lib/admin/session";

export const metadata = { title: "New category · Studio" };

type Cat = { id: number; name: string; parent_id: number | null };

export default async function NewCategoryPage({ searchParams }: { searchParams: Promise<{ parent?: string }> }) {
  await requireUser("/studio/login");
  const sp = await searchParams;
  const allCats = await sql.all<Cat>("SELECT id, name, parent_id FROM categories ORDER BY sort_order ASC");
  const preselectedParent = sp.parent ? Number(sp.parent) : undefined;
  const parentCat = preselectedParent ? allCats.find(c => c.id === preselectedParent) : undefined;

  return (
    <div className="stu-page stu-page--narrow">
      <PageHead
        title={parentCat ? `New subcategory under ${parentCat.name}` : "New category"}
        sub="This will appear in your store navigation."
        back={{ href: "/studio/categories", label: "Back to categories" }}>
        <Link href="/studio/categories" className="stu-btn stu-btn--ghost">Cancel</Link>
      </PageHead>
      <CategoryForm tops={allCats} preselectedParent={preselectedParent} />
    </div>
  );
}
