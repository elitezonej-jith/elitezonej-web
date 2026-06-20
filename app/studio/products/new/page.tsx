import Link from "next/link";
import { sql } from "../../../../lib/admin/db";
import PageHead from "../../components/PageHead";
import ProductForm from "../[slug]/ProductForm";
import { requireUser } from "../../../../lib/admin/session";

export const metadata = { title: "New product · Studio" };

export default async function NewProductPage() {
  await requireUser("/studio/login");
  const categories = await sql.all<{ id: number; name: string; slug: string; parent_id: number | null }>(
    "SELECT id, name, slug, parent_id FROM categories ORDER BY sort_order ASC, name ASC"
  );
  return (
    <div className="stu-page">
      <PageHead title="Add a product" sub="Fill in the basics, then upload images after saving."
                back={{ href: "/studio/products", label: "Back to products" }}>
        <Link href="/studio/products" className="stu-btn stu-btn--ghost">Cancel</Link>
      </PageHead>
      <ProductForm mode="new" categories={categories} />
    </div>
  );
}
