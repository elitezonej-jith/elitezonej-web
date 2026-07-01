import { sql } from "../../../../lib/admin/db";
import PageHead from "../../components/PageHead";
import { requireUser } from "../../../../lib/admin/session";
import WalkInOrderForm from "./WalkInOrderForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Walk-In Order · Studio" };

export default async function NewWalkInOrderPage() {
  await requireUser("/studio/login");

  // Load active products for the search combobox
  const products = await sql.all<{
    slug: string; name: string; price: number; sale_price: number | null; kind: string; sizes_json: string;
  }>(
    `SELECT slug, name, price, sale_price, kind, sizes_json FROM products
     WHERE status = 'active' ORDER BY name ASC`
  );

  return (
    <div className="stu-page">
      <PageHead
        title="New walk-in order"
        sub="Create an invoice for a physical store purchase"
        back={{ href: "/studio/orders", label: "Back to orders" }}
      />
      <WalkInOrderForm products={products} />
    </div>
  );
}
