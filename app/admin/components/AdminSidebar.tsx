"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "../actions/auth";
import type { User } from "../../../lib/admin/types";

type Counts = {
  products: number;
  fabrics: number;
  bookingsNew: number;
  orders: number;
};

const NAV: Array<
  | { kind: "group"; label: string }
  | { kind: "link"; href: string; label: string; countKey?: keyof Counts }
> = [
  { kind: "group", label: "Day" },
  { kind: "link", href: "/admin", label: "Dashboard" },
  { kind: "link", href: "/admin/orders", label: "Orders", countKey: "orders" },
  { kind: "link", href: "/admin/bespoke", label: "Bespoke", countKey: "bookingsNew" },
  { kind: "link", href: "/admin/customers", label: "Customers" },

  { kind: "group", label: "Catalogue" },
  { kind: "link", href: "/admin/products", label: "Products", countKey: "products" },
  { kind: "link", href: "/admin/fabrics", label: "Fabrics", countKey: "fabrics" },
  { kind: "link", href: "/admin/inventory", label: "Inventory" },
  { kind: "link", href: "/admin/categories", label: "Categories" },
  { kind: "link", href: "/admin/promotions", label: "Promotions" },

  { kind: "group", label: "Surface" },
  { kind: "link", href: "/admin/content", label: "Content" },
  { kind: "link", href: "/admin/media", label: "Media" },

  { kind: "group", label: "Atelier" },
  { kind: "link", href: "/admin/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminSidebar({ user, counts }: { user: User; counts: Counts }) {
  const pathname = usePathname();
  return (
    <aside className="adm-spine" aria-label="Atelier navigation">
      <Link href="/admin" className="adm-spine__brand" prefetch>
        <span className="adm-spine__sigil">EZJ</span>
        <span className="adm-spine__line">Atelier · Operations</span>
      </Link>

      <nav className="adm-spine__nav">
        {NAV.map((item, i) =>
          item.kind === "group" ? (
            <div key={`g-${i}`} className="adm-spine__group">{item.label}</div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={"adm-spine__link" + (isActive(pathname, item.href) ? " active" : "")}
              prefetch
            >
              <span>{item.label}</span>
              {item.countKey && counts[item.countKey] > 0 && (
                <span
                  className={
                    "adm-spine__link__count" +
                    (item.countKey === "products" || item.countKey === "fabrics" ? " is-tally" : "")
                  }
                >
                  {counts[item.countKey]}
                </span>
              )}
            </Link>
          ),
        )}
      </nav>

      <form className="adm-spine__foot" action={signOutAction}>
        <div>
          <span className="adm-spine__foot__name">{user.name}</span>
          <span className="adm-spine__foot__role">{user.role}</span>
        </div>
        <button type="submit" className="adm-spine__foot__out" aria-label="Sign out">
          Out
        </button>
      </form>
    </aside>
  );
}
