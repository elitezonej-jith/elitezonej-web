import type { ReactNode } from "react";

export default function SectionRule({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="adm-section-rule">
      {kicker && <span className="adm-section-rule__kicker">{kicker}</span>}
      <h2 className="adm-section-rule__title">{title}</h2>
      {children && <div className="adm-section-rule__aside">{children}</div>}
    </div>
  );
}
