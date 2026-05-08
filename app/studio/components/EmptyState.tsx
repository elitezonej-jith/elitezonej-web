import type { ReactNode } from "react";

export default function EmptyState({
  icon, title, body, action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="stu-empty">
      {icon && <div className="stu-empty__icon">{icon}</div>}
      <h3 className="stu-empty__title">{title}</h3>
      {body && <p className="stu-empty__body">{body}</p>}
      {action}
    </div>
  );
}
