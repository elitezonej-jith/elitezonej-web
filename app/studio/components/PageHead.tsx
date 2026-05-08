import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrowLeft } from "./Icons";

export default function PageHead({
  title, sub, back, children,
}: {
  title: string;
  sub?: string;
  back?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <header className="stu-page-head">
      <div className="stu-page-head__main">
        {back && (
          <Link href={back.href} className="stu-page-head__back">
            <IconArrowLeft width={14} height={14} />
            {back.label}
          </Link>
        )}
        <h1 className="stu-page-head__title">{title}</h1>
        {sub && <p className="stu-page-head__sub">{sub}</p>}
      </div>
      {children && <div className="stu-page-head__actions">{children}</div>}
    </header>
  );
}
