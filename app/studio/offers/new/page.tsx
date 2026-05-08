import Link from "next/link";
import { listProducts } from "../../../../lib/admin/repos/products";
import { getDb } from "../../../../lib/admin/db";
import PageHead from "../../components/PageHead";
import OfferForm from "../[code]/OfferForm";

export const metadata = { title: "New offer · Studio" };

type Cat = { id: number; name: string; slug: string; parent_id: number | null };

export default function NewOfferPage() {
  const products = listProducts({ status: "all", limit: 200 });
  const cats = getDb().prepare("SELECT id, name, slug, parent_id FROM categories ORDER BY name ASC").all() as Cat[];
  return (
    <div className="stu-page">
      <PageHead title="New offer" sub="Pick a discount type, set the rules, choose what it applies to."
                back={{ href: "/studio/offers", label: "Back to offers" }}>
        <Link href="/studio/offers" className="stu-btn stu-btn--ghost">Cancel</Link>
      </PageHead>
      <OfferForm products={products} categories={cats} />
    </div>
  );
}
