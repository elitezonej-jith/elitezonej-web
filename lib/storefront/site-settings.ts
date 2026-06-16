import "server-only";
import { unstable_cache } from "next/cache";
import { getSettings } from "../admin/repos/settings";
import { CACHE_TAGS } from "./cache";

// Storefront-safe settings subset. Scoped to values that are *visibly
// hardcoded the same way today* (brand name, currency) so surfacing them
// cannot cause a visual regression: on a fresh seed the seeded values equal
// the current literals, and an unset/empty value falls back to that literal.
// Footer social/help links are intentionally NOT settings-driven — they are
// not contact-settings today and rewiring them would break parity.
export type SiteSettings = {
  brandName: string;
  currency: string;
  currencySymbol: string;
  leadTimeDays: number;
};

const FALLBACK: SiteSettings = {
  brandName: "Elite Zone J",
  currency: "INR",
  currencySymbol: "₹",
  leadTimeDays: 14,
};

// Cross-request cache: the settings read (one `SELECT key,value FROM settings`)
// is shared across Header/Footer/PDP/homepage/bespoke instead of hitting the DB
// once per surface per request. Served from cache until an Admin settings save
// calls `bustSettings()` (or the 1h TTL lapses).
export const getSiteSettings = unstable_cache(
  _getSiteSettings,
  ["storefront-site-settings"],
  { revalidate: 3600, tags: [CACHE_TAGS.settings] },
);

async function _getSiteSettings(): Promise<SiteSettings> {
  let s: Record<string, string> = {};
  try {
    s = await getSettings();
  } catch {
    /* no DB / ephemeral cold start — use fallbacks */
  }
  const pick = (k: string, fb: string) =>
    s[k] && s[k].trim().length ? s[k] : fb;
  const leadRaw = Number(s["lead_time_days"]);
  const leadTimeDays = Number.isFinite(leadRaw) && leadRaw > 0 ? Math.trunc(leadRaw) : FALLBACK.leadTimeDays;
  return {
    brandName: pick("brand_name", FALLBACK.brandName),
    currency: pick("currency", FALLBACK.currency),
    currencySymbol: pick("currency_symbol", FALLBACK.currencySymbol),
    leadTimeDays,
  };
}
