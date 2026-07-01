import Link from "next/link";
import StatusPill from "./StatusPill";

type Props = {
  slug: string;
  name: string;
  kind: "tailored" | "fabric";
  status: "healthy" | "low" | "oos";
  total: number;
  unit: string;
  colourCount?: number;
  children: React.ReactNode; // StockCell grid or FabricCell grid
};

export default function InventoryCard({ slug, name, kind, status, total, unit, colourCount, children }: Props) {
  return (
    <div className={`inv2-card inv2-card--${status}`}>
      <div className="inv2-card__head">
        <div className="inv2-card__info">
          <Link href={`/studio/products/${slug}`} className="inv2-card__name">{name}</Link>
          <span className="inv2-card__meta">
            {kind === "fabric" ? `Fabric · ${colourCount ?? 0} colourway${(colourCount ?? 0) !== 1 ? "s" : ""}` : "Clothing"}
            {" · "}
            <Link href={`/products/${slug}`} target="_blank" className="inv2-card__link">Store ↗</Link>
          </span>
        </div>
        <div className="inv2-card__right">
          <StatusPill status={status} />
          <span className="inv2-card__total">{total}{unit === "m" ? "m" : ""}</span>
        </div>
      </div>
      <div className="inv2-card__grid">
        {children}
      </div>
    </div>
  );
}
