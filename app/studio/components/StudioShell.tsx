"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOutStudioAction } from "../actions/auth";
import {
  IconHome, IconBag, IconScissors, IconSparkles, IconTag, IconBolt,
  IconImage, IconLayers, IconBell, IconCalendar, IconBox, IconList,
  IconFolder, IconCog, IconLogout, IconUser,
} from "./Icons";
import type { User } from "../../../lib/admin/types";

type Counts = {
  products: number;
  bookingsNew: number;
  ordersOpen: number;
  bannersDraft: number;
  reviewsPending: number;
};

const NAV: Array<
  | { kind: "group"; label: string }
  | { kind: "link"; href: string; label: string; icon: keyof typeof ICONS; countKey?: keyof Counts }
> = [
  { kind: "group", label: "Overview" },
  { kind: "link", href: "/studio", label: "Dashboard", icon: "home" },

  { kind: "group", label: "Storefront" },
  { kind: "link", href: "/studio/banners",   label: "Banners",   icon: "image",   countKey: "bannersDraft" },
  { kind: "link", href: "/studio/notices",   label: "Notices",   icon: "bell" },
  { kind: "link", href: "/studio/homepage",  label: "Homepage",  icon: "layers" },

  { kind: "group", label: "Catalog" },
  { kind: "link", href: "/studio/products",   label: "Products",   icon: "bag",      countKey: "products" },
  { kind: "link", href: "/studio/categories", label: "Categories", icon: "folder" },
  { kind: "link", href: "/studio/reviews",    label: "Reviews",    icon: "bell",     countKey: "reviewsPending" },

  { kind: "group", label: "Marketing" },
  { kind: "link", href: "/studio/offers",      label: "Offers & coupons", icon: "tag" },
  { kind: "link", href: "/studio/flash-sales", label: "Flash sales",      icon: "bolt" },

  { kind: "group", label: "Operations" },
  { kind: "link", href: "/studio/orders",    label: "Orders",     icon: "list",      countKey: "ordersOpen" },
  { kind: "link", href: "/studio/customers", label: "Customers",  icon: "user" },
  { kind: "link", href: "/studio/bespoke",   label: "Bespoke leads", icon: "scissors", countKey: "bookingsNew" },

  { kind: "group", label: "Library" },
  { kind: "link", href: "/studio/media",     label: "Media",      icon: "sparkles" },

  { kind: "group", label: "System" },
  { kind: "link", href: "/studio/settings",  label: "Settings",   icon: "cog" },
];

const ICONS = {
  home: IconHome, bag: IconBag, scissors: IconScissors, sparkles: IconSparkles,
  tag: IconTag, bolt: IconBolt, image: IconImage, layers: IconLayers,
  bell: IconBell, calendar: IconCalendar, box: IconBox, list: IconList,
  folder: IconFolder, cog: IconCog, user: IconUser,
};

function isActive(pathname: string, href: string) {
  if (href === "/studio") return pathname === "/studio";
  return pathname === href || pathname.startsWith(href + "/");
}

const LABELS: Record<string, string> = {
  studio: "Studio",
  products: "Products",
  categories: "Categories",
  banners: "Banners",
  notices: "Notices",
  homepage: "Homepage",
  offers: "Offers",
  "flash-sales": "Flash sales",
  media: "Media",
  orders: "Orders",
  customers: "Customers",
  bespoke: "Bespoke",
  settings: "Settings",
  new: "New",
};

function humanizeSeg(seg: string): string {
  const s = decodeURIComponent(seg);
  if (/^\d+$/.test(s)) return `#${s}`;
  return s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StudioShell({
  user, counts, children,
}: {
  user: User;
  counts: Counts;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <div className="stu-shell stu">
      <aside className="stu-side" aria-label="Studio navigation">
        <Link href="/studio" className="stu-side__brand">
          <span className="stu-side__brand__mark">EZJ</span>
          <span>
            <span className="stu-side__brand__name">Elite Zone J</span>
            <span className="stu-side__brand__sub">Studio</span>
          </span>
        </Link>

        <nav className="stu-side__nav">
          {NAV.map((item, i) => {
            if (item.kind === "group") {
              return <div key={`g-${i}`} className="stu-side__group">{item.label}</div>;
            }
            const Icon = ICONS[item.icon];
            const count = item.countKey ? counts[item.countKey] : 0;
            // "products" is a catalogue tally, not an action item — render it
            // muted so the coloured badge stays meaningful for attention counts
            // (new bookings, open orders, draft banners).
            const isTally = item.countKey === "products";
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`stu-side__link${active ? " active" : ""}`}
                prefetch
              >
                <Icon className="stu-side__link__icon" />
                <span>{item.label}</span>
                {count > 0 && (
                  <span className={`stu-side__link__count${isTally ? " is-tally" : ""}`}>{count}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <form action={signOutStudioAction} className="stu-side__foot">
          <span className="stu-side__avatar">{initials || "EZ"}</span>
          <div className="stu-side__foot__meta">
            <span className="stu-side__foot__name">{user.name}</span>
            <span className="stu-side__foot__role">{user.role}</span>
          </div>
          <button type="submit" className="stu-side__foot__out" aria-label="Sign out">
            <IconLogout />
          </button>
        </form>
      </aside>

      <div className="stu-canvas">
        <header className="stu-topbar">
          <div className="stu-topbar__crumbs">
            {segments.map((seg, i) => {
              const last = i === segments.length - 1;
              const text = LABELS[seg] ?? humanizeSeg(seg);
              return (
                <span key={i}>
                  {i > 0 && <span className="stu-topbar__crumbs__sep"> / </span>}
                  {last ? <strong>{text}</strong> : <span>{text}</span>}
                </span>
              );
            })}
          </div>
          <Link href="/" className="stu-topbar__view" target="_blank">
            View store ↗
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}
