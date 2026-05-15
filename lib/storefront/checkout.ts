import "server-only";
import { getDb } from "../admin/db";

// ── Tunables ────────────────────────────────────────────────────────────────
// Elite Zone J ships complimentary; tax is price-inclusive. Both are overridable
// via env without code changes if the brand policy evolves.
export const SHIPPING_FLAT = Number(process.env.SHIPPING_FLAT_INR ?? 0);
export const FREE_SHIP_OVER = Number(process.env.FREE_SHIP_OVER_INR ?? 0);
export const TAX_RATE = Number(process.env.TAX_RATE ?? 0); // 0.18 == 18% GST

export type CartLineInput = {
  slug: string;
  qty: number;
  size?: string | null;
  colour?: string | null;
  isFabric?: boolean;
};

export type PricedLine = {
  slug: string;
  name: string;
  qty: number;
  unit_price: number; // server-derived, never trusted from client
  size: string | null;
  colour: string | null;
  is_fabric: boolean;
  line_total: number;
  category: string;
};

export type Pricing = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  promo_code: string | null;
};

export type PriceResult =
  | { ok: true; lines: PricedLine[]; pricing: Pricing }
  | { ok: false; error: string };

type ProductRow = {
  slug: string;
  name: string;
  price: number;
  sale_price: number | null;
  kind: string;
  status: string;
  category: string;
};

function effectiveUnitPrice(p: ProductRow): number {
  return p.sale_price != null && p.sale_price > 0 && p.sale_price < p.price
    ? p.sale_price
    : p.price;
}

/**
 * Re-prices a client cart from the database (single source of truth) and
 * applies an optional promo. Performs no writes and no stock mutation — it
 * only *reads* stock to reject obviously-unfulfillable carts early. The
 * authoritative stock check + decrement happens in `fulfilOrderPaid()` inside
 * a transaction at payment time.
 */
export function priceCart(lines: CartLineInput[], promoCode?: string | null): PriceResult {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: "Your bag is empty." };
  }
  if (lines.length > 50) return { ok: false, error: "Too many items in one order." };

  const db = getDb();
  const getProduct = db.prepare(
    "SELECT slug, name, price, sale_price, kind, status, category FROM products WHERE slug = ?",
  );
  const getInv = db.prepare(
    "SELECT stock, oos_flag FROM inventory WHERE product_slug = ? AND size = ?",
  );
  const getColour = db.prepare(
    "SELECT stock_meters FROM fabric_colours WHERE product_slug = ? AND name = ?",
  );

  const priced: PricedLine[] = [];
  for (const raw of lines) {
    const slug = String(raw.slug ?? "").trim();
    const qty = Number(raw.qty);
    if (!slug || !Number.isFinite(qty) || qty <= 0) {
      return { ok: false, error: "Invalid item in your bag." };
    }
    const p = getProduct.get(slug) as ProductRow | undefined;
    if (!p) return { ok: false, error: `“${slug}” is no longer available.` };
    if (p.status !== "active") {
      return { ok: false, error: `“${p.name}” is currently unavailable.` };
    }

    const isFabric = p.kind === "fabric";
    const unit = effectiveUnitPrice(p);

    if (isFabric) {
      const colour = (raw.colour ?? "").toString().trim();
      if (!colour) return { ok: false, error: `Choose a colour for ${p.name}.` };
      const c = getColour.get(slug, colour) as { stock_meters: number } | undefined;
      if (!c) return { ok: false, error: `${p.name} — colour “${colour}” unavailable.` };
      if (c.stock_meters < qty) {
        return { ok: false, error: `Only ${c.stock_meters}m of ${p.name} (${colour}) left.` };
      }
      priced.push({
        slug, name: p.name, qty, unit_price: unit, size: null, colour,
        is_fabric: true, line_total: Math.round(unit * qty), category: p.category,
      });
    } else {
      const size = (raw.size ?? "").toString().trim() || null;
      const inv = getInv.get(slug, size ?? "") as
        | { stock: number; oos_flag: number }
        | undefined;
      // No inventory row ⇒ untracked size; treat as unavailable to be safe.
      if (!inv || inv.oos_flag === 1 || inv.stock < qty) {
        return { ok: false, error: `“${p.name}”${size ? ` (size ${size})` : ""} is out of stock.` };
      }
      priced.push({
        slug, name: p.name, qty: Math.round(qty), unit_price: unit, size, colour: null,
        is_fabric: false, line_total: Math.round(unit * Math.round(qty)), category: p.category,
      });
    }
  }

  const subtotal = priced.reduce((a, l) => a + l.line_total, 0);

  // ── Promo ────────────────────────────────────────────────────────────────
  let discount = 0;
  let appliedPromo: string | null = null;
  let waiveShipping = false;
  if (promoCode && promoCode.trim()) {
    const v = validatePromo(promoCode.trim(), priced, subtotal);
    if (!v.ok) return { ok: false, error: v.error };
    discount = v.discount;
    waiveShipping = v.waiveShipping;
    appliedPromo = v.code;
  }

  const baseShipping =
    FREE_SHIP_OVER > 0 && subtotal - discount >= FREE_SHIP_OVER ? 0 : SHIPPING_FLAT;
  const shipping = waiveShipping ? 0 : baseShipping;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * TAX_RATE);
  const total = Math.max(0, taxable + shipping + tax);

  return {
    ok: true,
    lines: priced,
    pricing: { subtotal, discount, shipping, tax, total, promo_code: appliedPromo },
  };
}

type PromoRow = {
  code: string;
  type: "percent" | "flat" | "free_ship";
  value: number;
  starts_at: string | null;
  ends_at: string | null;
  min_total: number;
  usage_limit: number | null;
  usage_count: number;
  status: string;
};

type PromoCheck =
  | { ok: true; code: string; discount: number; waiveShipping: boolean }
  | { ok: false; error: string };

export function validatePromo(
  code: string,
  lines: PricedLine[],
  subtotal: number,
): PromoCheck {
  const db = getDb();
  const promo = db
    .prepare("SELECT * FROM promotions WHERE code = ?")
    .get(code) as PromoRow | undefined;
  if (!promo) return { ok: false, error: "Invalid promo code." };
  if (promo.status !== "active") return { ok: false, error: "This code is not active." };

  const now = Date.now();
  if (promo.starts_at && Date.parse(promo.starts_at) > now) {
    return { ok: false, error: "This code is not active yet." };
  }
  if (promo.ends_at && Date.parse(promo.ends_at) < now) {
    return { ok: false, error: "This code has expired." };
  }
  if (promo.usage_limit != null && promo.usage_count >= promo.usage_limit) {
    return { ok: false, error: "This code has reached its usage limit." };
  }
  if (subtotal < promo.min_total) {
    return { ok: false, error: `Add ₹${promo.min_total - subtotal} more to use this code.` };
  }

  // Targeting: if explicit product/category targets exist, the discount only
  // applies to the matching portion of the cart.
  const targets = db
    .prepare("SELECT target_type, target_id FROM offer_targets WHERE promo_code = ?")
    .all(code) as Array<{ target_type: string; target_id: string }>;
  const scoped = targets.filter((t) => t.target_type !== "all" && t.target_id);
  let eligible = subtotal;
  if (scoped.length) {
    const prodIds = new Set(scoped.filter((t) => t.target_type === "product").map((t) => t.target_id));
    const catIds = new Set(scoped.filter((t) => t.target_type === "category").map((t) => t.target_id));
    eligible = lines
      .filter((l) => prodIds.has(l.slug) || catIds.has(l.category))
      .reduce((a, l) => a + l.line_total, 0);
    if (eligible <= 0) {
      return { ok: false, error: "This code doesn't apply to the items in your bag." };
    }
  }

  if (promo.type === "free_ship") {
    return { ok: true, code: promo.code, discount: 0, waiveShipping: true };
  }
  const discount =
    promo.type === "percent"
      ? Math.round((eligible * promo.value) / 100)
      : Math.min(promo.value, eligible);
  return { ok: true, code: promo.code, discount, waiveShipping: false };
}
