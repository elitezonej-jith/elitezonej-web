"use client";
import Link from "next/link";

export default function InvoiceClientActions({ orderId }: { orderId: string }) {
  return (
    <div className="cust-inv-actions no-print">
      <Link href={`/account/orders/${orderId}`} className="cust-inv-btn cust-inv-btn--back">← Back to order</Link>
      <button type="button" onClick={() => window.print()} className="cust-inv-btn cust-inv-btn--print">
        Print / Download PDF
      </button>
    </div>
  );
}
