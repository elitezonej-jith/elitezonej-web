import Link from "next/link";
import PageHead from "../../components/PageHead";
import ProductForm from "../[slug]/ProductForm";
import { requireUser } from "../../../../lib/admin/session";

export const metadata = { title: "New product · Studio" };

export default async function NewProductPage() {
  await requireUser("/studio/login");
  return (
    <div className="stu-page">
      <PageHead title="Add a product" sub="Set the basics, then you can upload images and refine after saving."
                back={{ href: "/studio/products", label: "Back to products" }}>
        <Link href="/studio/products" className="stu-btn stu-btn--ghost">Cancel</Link>
      </PageHead>
      <ProductForm mode="new" />
    </div>
  );
}
