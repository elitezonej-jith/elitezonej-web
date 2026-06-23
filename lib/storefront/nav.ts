import "server-only";
import { unstable_cache } from "next/cache";
import { sql } from "../admin/db";
import { CACHE_TAGS } from "./cache";
import { NAV, type NavCategory, type NavGroup, type NavLink } from "../../app/components/nav-data";
import { CAT_DATA, SUBCATS, type SubcatMeta } from "../subcats";

// ── Types ────────────────────────────────────────────────────────────────
type DbCatRow = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  gender: string | null;
  kind: string | null;
  sort_order: number;
  enabled: number;
};

// ── Cached DB read ───────────────────────────────────────────────────────
const _dbCatRows = unstable_cache(
  async (): Promise<DbCatRow[]> => {
    try {
      return await sql.all<DbCatRow>(
        "SELECT id, parent_id, name, slug, gender, kind, sort_order, enabled FROM categories ORDER BY sort_order ASC, id ASC",
      );
    } catch {
      return [];
    }
  },
  ["storefront-categories"],
  { revalidate: 3600, tags: [CACHE_TAGS.categories] },
);

// ── Static NAV lookup helpers ────────────────────────────────────────────
// Index static nav items by their href slug for metadata enrichment.
const STATIC_NAV_BY_SLUG = new Map<string, NavCategory>();
const STATIC_ITEMS_BY_HREF = new Map<string, NavLink>();
for (const cat of NAV) {
  const slug = hrefToSlug(cat.href);
  if (slug) STATIC_NAV_BY_SLUG.set(slug, cat);
  for (const g of cat.groups ?? []) {
    for (const it of g.items) STATIC_ITEMS_BY_HREF.set(it.href, it);
  }
}

function hrefToSlug(href: string): string | null {
  const q = href.indexOf("?");
  if (q < 0) return null;
  const sp = new URLSearchParams(href.slice(q + 1));
  return sp.get("sub") || sp.get("c") || null;
}

// ── Build nav from DB hierarchy ──────────────────────────────────────────
export async function getStorefrontNav(): Promise<NavCategory[]> {
  const rows = await _dbCatRows();
  if (!rows.length) return NAV; // no DB categories yet — pure static fallback

  const enabled = rows.filter((r) => r.enabled !== 0);
  const topLevel = enabled.filter((r) => r.parent_id === null);
  const byParent = new Map<number, DbCatRow[]>();
  for (const r of enabled) {
    if (r.parent_id !== null) {
      const siblings = byParent.get(r.parent_id) ?? [];
      siblings.push(r);
      byParent.set(r.parent_id, siblings);
    }
  }

  const result: NavCategory[] = [];

  for (const top of topLevel) {
    const href = `/collection?c=${top.slug}`;
    const children = byParent.get(top.id) ?? [];
    const staticCat = STATIC_NAV_BY_SLUG.get(top.slug);

    // No children → simple link (like "Fabrics", "Bespoke")
    if (!children.length) {
      result.push({
        href,
        label: top.name,
        sale: staticCat?.sale,
      });
      continue;
    }

    // Has children → build mega-menu groups.
    // Group by: if children themselves have children (sub-sub), each child is
    // a group title. Otherwise all children go into one group named after the parent.
    const groups: NavGroup[] = [];
    const childrenWithSubs: DbCatRow[] = [];
    const leafChildren: DbCatRow[] = [];

    for (const child of children) {
      if (byParent.has(child.id)) childrenWithSubs.push(child);
      else leafChildren.push(child);
    }

    // Children that have their own sub-categories → each becomes a group
    for (const child of childrenWithSubs) {
      const subs = byParent.get(child.id) ?? [];
      const items: NavLink[] = subs.map((sub) => {
        const subHref = `/collection?c=${top.slug}&sub=${sub.slug}`;
        const staticItem = STATIC_ITEMS_BY_HREF.get(subHref);
        return { href: subHref, label: sub.name, meta: staticItem?.meta };
      });
      groups.push({ title: child.name, items });
    }

    // Leaf children (no sub-sub) → grouped together
    if (leafChildren.length) {
      const items: NavLink[] = leafChildren.map((child) => {
        const childHref = `/collection?c=${top.slug}&sub=${child.slug}`;
        const staticItem = STATIC_ITEMS_BY_HREF.get(childHref);
        return { href: childHref, label: child.name, meta: staticItem?.meta };
      });
      // If there are already groups, put these under a generic group
      groups.push({ title: groups.length ? "More" : top.name, items });
    }

    result.push({
      href,
      label: top.name,
      groups: groups.length ? groups : undefined,
      footer: staticCat?.footer,
      sale: staticCat?.sale,
    });
  }

  // Append non-category static nav items (Bespoke, Premium, View All, Sale)
  // that don't correspond to a DB category.
  const dbSlugs = new Set(topLevel.map((r) => r.slug));
  for (const cat of NAV) {
    const slug = hrefToSlug(cat.href);
    // Keep items that aren't DB-driven categories (bespoke page, premium, sale, view all)
    if (!slug || !dbSlugs.has(slug)) {
      // Avoid duplicates if DB has "all" or "sale" as categories
      if (!result.some((r) => r.href === cat.href)) {
        result.push(cat);
      }
    }
  }

  return result;
}

// ── Collection-page heading (unchanged logic) ────────────────────────────
export async function getCategoryMeta(cat: string, sub: string): Promise<SubcatMeta> {
  const fromSub = sub ? SUBCATS[cat]?.[sub] : undefined;
  const base: SubcatMeta = fromSub ?? CAT_DATA[cat] ?? { title: "Collection", stand: "" };

  // Check DB for renamed category
  const slug = sub || cat;
  const rows = await _dbCatRows();
  const match = rows.find((r) => r.slug === slug && r.enabled !== 0);
  if (match) {
    const defaultTitle = fromSub?.title ?? CAT_DATA[cat]?.title;
    if (match.name !== defaultTitle) {
      return { ...base, title: match.name };
    }
  }
  return base;
}
