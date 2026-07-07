import { notFound } from "next/navigation";
import { getOrder, getOrderItems } from "../../../../../lib/admin/repos/orders";
import { requireUser } from "../../../../../lib/admin/session";
import { getBusinessInfo, splitGst, invoiceDate, computeItemGst, itemTotal } from "../../../../../lib/admin/invoice";
import InvoiceActions from "./InvoiceActions";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function fmtNum(n: number): string {
  return n.toLocaleString("en-IN");
}

export default async function InvoicePage({ params }: Params) {
  await requireUser("/studio/login");
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const items = await getOrderItems(id);
  const biz = await getBusinessInfo();

  // Compute per-item GST (use stored gst_amount if available, else compute from rate)
  const lineItems = items.map((it) => {
    const gstRate = it.gst_rate ?? 5;
    const gstAmount = it.gst_amount > 0 ? it.gst_amount : computeItemGst(it.unit_price, it.qty, gstRate);
    const total = itemTotal(it.unit_price, it.qty, gstAmount);
    return { ...it, gstRate, gstAmount, total };
  });

  const totalGst = lineItems.reduce((sum, it) => sum + it.gstAmount, 0);
  const gst = splitGst(totalGst, biz.state_code, order.ship_state || "");
  const grandTotal = lineItems.reduce((sum, it) => sum + it.total, 0);

  const customerName = order.ship_name || order.customer || "—";
  const customerPhone = order.phone || "—";
  const customerGst = "N/A"; // Walk-in customers typically don't have GSTIN

  return (
    <div className="inv-page">
      <InvoiceActions orderId={order.id} />
      <div className="inv-doc tax-inv">

        {/* ── Header: TAX INVOICE + Business Details ──────────────── */}
        <div className="tax-inv__header">
          <div className="tax-inv__left">
            <h1 className="tax-inv__title">TAX INVOICE</h1>
            <p className="tax-inv__biz-name">{biz.legal_name}</p>
            <p className="tax-inv__address">{biz.address.split("\n").map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}</p>
          </div>
          <div className="tax-inv__right">
            <p><strong>GST NO:</strong> {biz.gstin}</p>
            <p><strong>STATE CODE:</strong> {biz.state_code}</p>
            <p><strong>PHONE NO :</strong> {biz.phone}</p>
            {biz.phone2 && <p style={{ paddingLeft: "5.5em" }}>{biz.phone2}</p>}
            <p><strong>EMAIL:</strong> {biz.email}</p>
          </div>
        </div>

        {/* ── Billed To + Invoice No ─────────────────────────────── */}
        <div className="tax-inv__row tax-inv__row--border">
          <div className="tax-inv__cell">
            <strong>BILLED TO:</strong>&nbsp;&nbsp;{customerName}
          </div>
          <div className="tax-inv__cell tax-inv__cell--right">
            <strong>INVOICE NO:</strong> {order.id}
          </div>
        </div>

        {/* ── Mobile + GST + Invoice Date ─────────────────────────── */}
        <div className="tax-inv__row tax-inv__row--border">
          <div className="tax-inv__cell">
            <p><strong>MOBILE NO:</strong>&nbsp;&nbsp;{customerPhone}</p>
            <p><strong>GST NO:</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{customerGst}</p>
          </div>
          <div className="tax-inv__cell tax-inv__cell--right">
            <p><strong>INVOICE DATE:</strong> {invoiceDate(order.created_at)}</p>
          </div>
        </div>

        {/* ── Line Items Table ────────────────────────────────────── */}
        <table className="tax-inv__table">
          <thead>
            <tr>
              <th className="tax-inv__th">DESCRIPTION</th>
              <th className="tax-inv__th tax-inv__th--num">QTY</th>
              <th className="tax-inv__th tax-inv__th--num">RATE</th>
              <th className="tax-inv__th tax-inv__th--num">GST RATE</th>
              <th className="tax-inv__th tax-inv__th--num">GST</th>
              <th className="tax-inv__th tax-inv__th--num">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((it) => (
              <tr key={it.id}>
                <td className="tax-inv__td">{it.product_name ?? it.product_slug}</td>
                <td className="tax-inv__td tax-inv__td--num">{it.qty}</td>
                <td className="tax-inv__td tax-inv__td--num">{fmtNum(it.unit_price)}</td>
                <td className="tax-inv__td tax-inv__td--num">{it.gstRate}%</td>
                <td className="tax-inv__td tax-inv__td--num">{fmtNum(it.gstAmount)}</td>
                <td className="tax-inv__td tax-inv__td--num">{fmtNum(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── GST Breakdown + Grand Total ─────────────────────────── */}
        <div className="tax-inv__summary">
          <div className="tax-inv__summary-row">
            <span className="tax-inv__summary-label">CGST</span>
            <span className="tax-inv__summary-value">{gst.cgst > 0 ? fmtNum(gst.cgst) : ""}</span>
          </div>
          <div className="tax-inv__summary-row">
            <span className="tax-inv__summary-label">SGST</span>
            <span className="tax-inv__summary-value">{gst.sgst > 0 ? fmtNum(gst.sgst) : ""}</span>
          </div>
          <div className="tax-inv__summary-row">
            <span className="tax-inv__summary-label">IGST</span>
            <span className="tax-inv__summary-value">{gst.igst > 0 ? fmtNum(gst.igst) : ""}</span>
          </div>
          <div className="tax-inv__summary-row tax-inv__summary-row--total">
            <span className="tax-inv__summary-label">GRAND TOTAL</span>
            <span className="tax-inv__summary-value">{fmtNum(grandTotal)}</span>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="tax-inv__footer">
          <p className="tax-inv__thanks"><strong>THANK YOU FOR<br />YOUR BUSINESS</strong></p>
        </div>

      </div>
    </div>
  );
}
