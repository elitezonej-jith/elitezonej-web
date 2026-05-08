import type { ReactNode } from "react";

export default function PageHead({
  kicker,
  title,
  emphasis,
  stand,
  children,
}: {
  kicker?: string;
  title: string;
  emphasis?: string;
  stand?: string;
  children?: ReactNode;
}) {
  return (
    <header className="adm-page-head">
      <div className="adm-page-head__rule" aria-hidden="true" />
      {kicker && <div className="adm-page-head__kicker">{kicker}</div>}
      <div className="adm-page-head__row">
        <h1 className="adm-page-head__title">
          {emphasis ? <em>{emphasis}</em> : null}
          {emphasis ? " " : null}
          {title}
        </h1>
        {children && <div className="adm-page-head__actions">{children}</div>}
      </div>
      {stand && <p className="adm-page-head__stand">{stand}</p>}
    </header>
  );
}
