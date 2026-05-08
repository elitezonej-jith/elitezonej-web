"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { FlashSale } from "../../../../lib/admin/repos/flash-sales";

function timeLeft(ends: string): string {
  const now = Date.now();
  const t = new Date(ends.replace(" ", "T")).getTime();
  let s = Math.max(0, Math.floor((t - now) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600);  s -= h * 3600;
  const m = Math.floor(s / 60);    s -= m * 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h}h ${m}m ${s}s`;
}

export default function FlashSaleBanner({ sale }: { sale: FlashSale }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, []);
  void tick;
  return (
    <section style={{
      padding: "14px 5vw",
      background: "#1A1613", color: "#FAF7F2",
      display: "flex", alignItems: "center", gap: 16, justifyContent: "center", flexWrap: "wrap",
      fontSize: 13.5,
    }}>
      <strong style={{ fontWeight: 600 }}>{sale.title}</strong>
      {sale.subtitle && <span style={{ opacity: 0.86 }}>· {sale.subtitle}</span>}
      <span style={{ background: "#7A1C1C", padding: "3px 10px", borderRadius: 999, fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.04em" }}>
        {timeLeft(sale.ends_at)}
      </span>
      {sale.promo_code && (
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.06em", background: "rgba(250,247,242,0.1)", padding: "3px 10px", borderRadius: 999 }}>
          Code · {sale.promo_code}
        </span>
      )}
      {sale.banner_image && (
        <Link href="/collection" style={{ marginLeft: "auto", color: "#FAF7F2", textDecoration: "underline", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Shop
        </Link>
      )}
    </section>
  );
}
