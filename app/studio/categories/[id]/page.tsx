import { notFound } from "next/navigation";
import Link from "next/link";
import { getDb } from "../../../../lib/admin/db";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import { FlashToast } from "../../components/Toast";
import CategoryForm from "./CategoryForm";
import CategoryDangerZone from "./CategoryDangerZone";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

type Cat = {
  id: number; parent_id: number | null; name: string; slug: string;
  gender: string | null; kind: string | null; sort_order: number;
  image_path: string; enabled: number;
};

export default async function EditCategoryPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { saved } = await searchParams;
  const cat = getDb().prepare("SELECT * FROM categories WHERE id = ?").get(Number(id)) as Cat | undefined;
  if (!cat) notFound();
  const tops = getDb().prepare("SELECT id, name, parent_id FROM categories WHERE parent_id IS NULL AND id != ? ORDER BY sort_order ASC").all(cat.id) as Array<{ id: number; name: string; parent_id: number | null }>;
  return (
    <div className="stu-page stu-page--narrow">
      <FlashToast flash={saved ? "Category saved" : undefined} />
      <PageHead title={cat.name} back={{ href: "/studio/categories", label: "Back to categories" }}>
        <StatusTag status={cat.enabled ? "active" : "disabled"} />
        <Link href="/studio/categories" className="stu-btn stu-btn--ghost">Done</Link>
      </PageHead>
      <CategoryForm tops={tops} category={cat} />
      <div style={{ height: 32 }} />
      <CategoryDangerZone id={cat.id} name={cat.name} />
    </div>
  );
}
