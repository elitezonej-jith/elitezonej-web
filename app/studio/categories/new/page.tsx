import Link from "next/link";
import { getDb } from "../../../../lib/admin/db";
import PageHead from "../../components/PageHead";
import CategoryForm from "../[id]/CategoryForm";

export const metadata = { title: "New category · Studio" };

type Cat = { id: number; name: string; parent_id: number | null };

export default function NewCategoryPage() {
  const tops = getDb().prepare("SELECT id, name, parent_id FROM categories WHERE parent_id IS NULL ORDER BY sort_order ASC").all() as Cat[];
  return (
    <div className="stu-page stu-page--narrow">
      <PageHead title="New category" sub="Categories appear in your storefront navigation."
                back={{ href: "/studio/categories", label: "Back to categories" }}>
        <Link href="/studio/categories" className="stu-btn stu-btn--ghost">Cancel</Link>
      </PageHead>
      <CategoryForm tops={tops} />
    </div>
  );
}
