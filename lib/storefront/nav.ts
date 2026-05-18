import "server-only";
import { getDb } from "../admin/db";
import { NAV, type NavCategory, type NavGroup } from "../../app/components/nav-data";
import { CAT_DATA, SUBCATS, type SubcatMeta } from "../subcats";

// Scoped category→storefront reflection (no schema change).
//
// The static NAV is a curated mega-menu (groups/footers/meta) far richer than
// the flat `categories` table. We keep that curated structure verbatim and only
// overlay GENUINE operator edits: a category that has been *renamed* (its DB
// name differs from the seeded default title) relabels its canonical menu
// entry + collection H1; a category *disabled* in Studio drops its canonical
// entry. When nothing has been changed the output equals the static NAV
// byte-for-byte (parity). Curated order, groups, footers and marketing "stand"
// copy always stay static (no DB column exists for them).

type DbCat = { name: string; enabled: number };

function loadDbCats(): Map<string, DbCat> {
  const map = new Map<string, DbCat>();
  try {
    const rows = getDb()
      .prepare("SELECT slug, name, gender, enabled FROM categories")
      .all() as Array<{ slug: string; name: string; gender: string | null; enabled: number }>;
    for (const r of rows) {
      map.set(`${r.gender ?? ""}:${r.slug}`, { name: r.name, enabled: r.enabled });
    }
  } catch {
    /* no categories table / ephemeral — leave map empty → static NAV */
  }
  return map;
}

function defaultTitle(slug: string, gender: string | null): string | undefined {
  if (gender && SUBCATS[gender]?.[slug]) return SUBCATS[gender][slug].title;
  return CAT_DATA[slug]?.title;
}

// Parse a nav href like "/collection?c=men&sub=tuxedos" into the category key.
// Top-level (no sub) has gender "" (DB top-level rows have gender NULL);
// sub-items key on their parent gender.
function keyForHref(href: string): { key: string; slug: string; gender: string | null } | null {
  const q = href.indexOf("?");
  if (q < 0) return null;
  const sp = new URLSearchParams(href.slice(q + 1));
  const c = sp.get("c");
  const sub = sp.get("sub");
  if (sub && c) return { key: `${c}:${sub}`, slug: sub, gender: c };
  if (c) return { key: `:${c}`, slug: c, gender: null };
  return null;
}

// Returns the DB override for a node, but ONLY when this node is the canonical
// entry for its category (its static label equals the seeded default title) —
// auxiliary curated links ("View All", "Sale") that happen to point at the same
// href are left untouched. Result: { drop } or { label } or null (unchanged).
function resolve(href: string, label: string, db: Map<string, DbCat>):
  | { drop: true }
  | { label: string }
  | null {
  const parsed = keyForHref(href);
  if (!parsed) return null;
  const def = defaultTitle(parsed.slug, parsed.gender);
  if (def === undefined || label !== def) return null; // not the canonical entry
  const hit = db.get(parsed.key);
  if (!hit) return null;
  if (hit.enabled === 0) return { drop: true };
  if (hit.name && hit.name !== def) return { label: hit.name };
  return null;
}

export function getStorefrontNav(): NavCategory[] {
  const db = loadDbCats();
  if (db.size === 0) return NAV;
  const out: NavCategory[] = [];
  for (const cat of NAV) {
    const r = resolve(cat.href, cat.label, db);
    if (r && "drop" in r) continue;
    const groups: NavGroup[] | undefined = cat.groups?.map((g) => ({
      title: g.title,
      items: g.items
        .map((it) => {
          const ir = resolve(it.href, it.label, db);
          if (ir && "drop" in ir) return null;
          return ir && "label" in ir ? { ...it, label: ir.label } : it;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    }));
    out.push({
      ...cat,
      label: r && "label" in r ? r.label : cat.label,
      groups,
    });
  }
  return out;
}

// Collection-page heading. Title reflects a genuine rename; "stand" (marketing
// sub-copy) and the `empty` flag always come from the static metadata, which
// has no DB column (per the approved scoped decision).
export function getCategoryMeta(cat: string, sub: string): SubcatMeta {
  const fromSub = sub ? SUBCATS[cat]?.[sub] : undefined;
  const base: SubcatMeta = fromSub ?? CAT_DATA[cat] ?? { title: "Collection", stand: "" };
  const db = loadDbCats();
  if (db.size === 0) return base;
  const slug = sub || cat;
  const gender = sub ? cat : null;
  const def = defaultTitle(slug, gender);
  const hit = db.get(`${gender ?? ""}:${slug}`);
  if (hit && def !== undefined && hit.name && hit.name !== def) {
    return { ...base, title: hit.name };
  }
  return base;
}
