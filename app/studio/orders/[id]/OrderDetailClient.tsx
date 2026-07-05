"use client";
import { useState } from "react";
import Link from "next/link";
import OrderControls from "./OrderControls";
import EditOrderForm from "./EditOrderForm";
import { rupees } from "../../../../lib/admin/format";

type Product = {
  slug: string;
  name: string;
  price: number;
  sale_price: number | null;
  kind: string;
  sizes_json: string;
};

type OrderItem = {
  id: number;
  order_id: string;
  product_slug: string;
  product_name: string | null;
  qty: number;
  unit_price: number;
  size: string | null;
  colour: string | null;
  is_fabric: number;
};

type OrderData = {
  id: string;
  customer_id: number;
  customer: string;
  email: string;
  phone: string | null;
  city: string | null;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_status: string;
  notes: string | null;
  ship_name: string;
  ship_line1: string;
  ship_line2: string;
  ship_city: string;
  ship_state: string;
  ship_pincode: string;
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
};

type CourierOption = { code: string; name: string };

type Props = {
  order: OrderData;
  items: OrderItem[];
  products: Product[];
  couriers: CourierOption[];
  isStaff: boolean;
};

export default function OrderDetailClient({ order, items, products, couriers, isStaff }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <EditOrderForm
        order={order}
        items={items}
        products={products}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  const orderSummary = `Order #${order.id}\n${order.customer} · ${order.email}\n${order.phone ?? ""}\n\nItems:\n${items.map(it => `• ${it.product_name ?? it.product_slug} (${it.size ?? "—"}) × ${it.qty} — ₹${it.unit_price * it.qty}`).join("\n")}\n\nTotal: ₹${order.total}\n\nShip to:\n${order.ship_name}\n${order.ship_line1}\n${order.ship_city}, ${order.ship_state} ${order.ship_pincode}`;

  return (
    <>
      <div style={{ marginBottom: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="stu-btn stu-btn--ghost" onClick={() => setEditing(true)}>
          ✎ Edit Order
        </button>
        <Link href={`/studio/orders/${order.id}/invoice`} className="stu-btn stu-btn--ghost">Invoice</Link>
      </div>

      <div className="stu-cols">
        <div className="stu-stack">
          <section className="stu-card">
            <header className="stu-card__head"><h3>Items</h3></header>
            <div className="stu-card__body--flush">
              <div className="stu-tbl-wrap">
                <table className="stu-tbl">
                  <thead><tr><th>Product</th><th>Variant</th><th className="stu-tbl__num">Qty</th>{!isStaff && <th className="stu-tbl__num">Unit</th>}{!isStaff && <th className="stu-tbl__num">Line</th>}</tr></thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td>
                          <Link href={`/studio/products/${it.product_slug}`} className="stu-tbl__name">{it.product_name ?? it.product_slug}</Link>
                          <span className="stu-tbl__sub">{it.product_slug}</span>
                        </td>
                        <td>{it.is_fabric ? `${it.colour ?? "—"} (metres)` : (it.size ?? "—")}</td>
                        <td className="stu-tbl__num">{it.qty}</td>
                        {!isStaff && <td className="stu-tbl__num">{rupees(it.unit_price)}</td>}
                        {!isStaff && <td className="stu-tbl__num">{rupees(it.unit_price * it.qty)}</td>}
                      </tr>
                    ))}
                  </tbody>
                  {!isStaff && (
                  <tfoot>
                    <tr><td colSpan={4} className="stu-tbl__num">Subtotal</td><td className="stu-tbl__num">{rupees(order.subtotal)}</td></tr>
                    {order.discount > 0 && <tr><td colSpan={4} className="stu-tbl__num">Discount</td><td className="stu-tbl__num">−{rupees(order.discount)}</td></tr>}
                    <tr><td colSpan={4} className="stu-tbl__num">Tax</td><td className="stu-tbl__num">{rupees(order.tax)}</td></tr>
                    <tr><td colSpan={4} className="stu-tbl__num" style={{ fontWeight: 700 }}>Total</td><td className="stu-tbl__num" style={{ fontWeight: 700 }}>{rupees(order.total)}</td></tr>
                  </tfoot>
                  )}
                </table>
              </div>
            </div>
          </section>
        </div>
        <div className="stu-stack">
          <OrderControls
            id={order.id}
            status={order.status}
            notes={order.notes ?? ""}
            couriers={couriers}
            tracking={{ courier_name: order.courier_name, tracking_number: order.tracking_number, tracking_url: order.tracking_url, shipped_at: order.shipped_at }}
            items={items.map(it => ({ product_name: it.product_name ?? it.product_slug, size: it.size, qty: it.qty, unit_price: it.unit_price }))}
            orderSummary={orderSummary}
          />
          <section className="stu-card">
            <header className="stu-card__head"><h3>Customer</h3></header>
            <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <strong>{order.customer}</strong>
              <span style={{ color: "var(--stu-text-3)" }}>{order.email}</span>
              <span style={{ color: "var(--stu-text-3)" }}>{order.phone ?? "—"} · {order.city ?? "—"}</span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
