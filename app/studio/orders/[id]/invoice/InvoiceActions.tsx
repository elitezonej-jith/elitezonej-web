"use client";
import Link from "next/link";

export default function InvoiceActions({ orderId }: { orderId: string }) {
  return (
    <div className="inv-actions no-print">
      <Link href={`/studio/orders/${orderId}`} className="stu-btn stu-btn--ghost">← Back to order</Link>
      <button type="button" onClick={() => window.print()} className="stu-btn stu-btn--primary">
        Print / Download PDF
      </button>
    </div>
  );
}
