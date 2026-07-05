import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, getOrderItems, listCouriers } from "../../../../lib/admin/repos/orders";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import OrderDetailClient from "./OrderDetailClient";
import { dateTime } from "../../../../lib/admin/format";
import { requireUser } from "../../../../lib/admin/session";
import { sql } from "../../../../lib/admin/db";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Params) {
  const me = await requireUser("/studio/login");
  const isStaff = me.role === "staff";
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const items = await getOrderItems(id);
  const couriers = await listCouriers();

  // Load products for the edit form's product search
  const products = await sql.all<{
    slug: string; name: string; price: number; sale_price: number | null; kind: string; sizes_json: string;
  }>(
    `SELECT slug, name, price, sale_price, kind, sizes_json FROM products
     WHERE status = 'active' ORDER BY name ASC`
  );

  return (
    <div className="stu-page">
      <PageHead title={`Order #${order.id}`} sub={`${order.customer} · ${dateTime(order.created_at)}`}
                back={{ href: "/studio/orders", label: "Back to orders" }}>
        <StatusTag status={order.status} />
      </PageHead>
      <OrderDetailClient
        order={order}
        items={items}
        products={products}
        couriers={couriers.map(c => ({ code: c.code, name: c.name }))}
        isStaff={isStaff}
      />
    </div>
  );
}
