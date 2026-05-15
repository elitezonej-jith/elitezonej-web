"use client";
import { usePathname } from "next/navigation";
import type { User } from "../../../lib/admin/types";

const LABELS: Record<string, string> = {
  admin: "Atelier",
  products: "Products",
  fabrics: "Fabrics",
  inventory: "Inventory",
  orders: "Orders",
  customers: "Customers",
  bespoke: "Bespoke",
  content: "Content",
  categories: "Categories",
  promotions: "Promotions",
  media: "Media",
  settings: "Settings",
  new: "New",
};

function humanize(seg: string): string {
  const s = decodeURIComponent(seg);
  if (/^\d+$/.test(s)) return `#${s}`;
  return s
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function crumbsFromPath(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p) => LABELS[p] ?? humanize(p));
}

const FORMATTER = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default function AdminTopbar({ user: _user }: { user: User }) {
  const pathname = usePathname();
  const crumbs = crumbsFromPath(pathname);
  const today = FORMATTER.format(new Date());
  return (
    <header className="adm-topbar">
      <nav className="adm-crumbs" aria-label="Breadcrumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
            {i > 0 && <span className="adm-crumbs__sep">·</span>}
            {i === crumbs.length - 1 ? <em>{c}</em> : <span>{c}</span>}
          </span>
        ))}
      </nav>
      <span className="adm-topbar__date">{today}</span>
    </header>
  );
}
