import { notFound } from "next/navigation";
import Link from "next/link";
import { sql } from "../../../../lib/admin/db";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import { FlashToast } from "../../components/Toast";
import CategoryForm from "./CategoryForm";
import CategoryDangerZone from "./CategoryDangerZone";
import { requireUser } from "../../../../lib/admin/session";

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
  const tops = await sql.all<{ id: number; name: string; parent_id: number | null }>("SELECT id, name, parent_id FROM categories WHERE parent_id IS NULL AND id != ? ORDER BY sort_order ASC", [cat.id]);
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
