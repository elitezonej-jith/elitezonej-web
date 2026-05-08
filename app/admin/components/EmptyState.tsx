import type { ReactNode } from "react";

export default function EmptyState({
  title = "Folio empty.",
  body = "Begin a new entry.",
  action,
}: {
  title?: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="adm-empty">
      <h3 className="adm-empty__title">{title}</h3>
      <p className="adm-empty__line">{body}</p>
      {action ? <div style={{ marginTop: 20 }}>{action}</div> : null}
    </div>
  );
}
