"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function InvoiceActions({ orderId }: { orderId: string }) {
  // Auto-print when redirected from walk-in order creation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("print")) {
        setTimeout(() => window.print(), 600);
      }
    }
  }, []);

  return (
    <div className="inv-actions no-print">
      <Link href={`/studio/orders/${orderId}`} className="stu-btn stu-btn--ghost">← Back to order</Link>
      <div style={{ display: "flex", gap: 8 }}>
        <Link href={`/studio/orders/new`} className="stu-btn stu-btn--ghost">+ New order</Link>
        <button type="button" onClick={() => window.print()} className="stu-btn stu-btn--primary">
          Print / Download PDF
        </button>
      </div>
    </div>
  );
}
