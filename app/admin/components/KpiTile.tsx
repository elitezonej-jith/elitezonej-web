import type { ReactNode } from "react";

export type KpiDelta = "up" | "down" | "flat";

export default function KpiTile({
  kicker,
  value,
  caption,
  delta,
  deltaLabel,
  lead,
  children,
}: {
  kicker: string;
  value: ReactNode;
  caption?: string;
  delta?: KpiDelta;
  deltaLabel?: string;
  lead?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={"adm-kpi" + (lead ? " adm-kpi--lead" : "")}>
      <span className="adm-kpi__kicker">{kicker}</span>
      <span className="adm-kpi__value">{value}</span>
      {deltaLabel && (
        <span className={"adm-kpi__delta " + (delta ?? "flat")}>
          {delta === "up" ? "▲" : delta === "down" ? "▼" : "▬"} {deltaLabel}
        </span>
      )}
      {caption && <span className="adm-kpi__caption">{caption}</span>}
      {children}
    </div>
  );
}
