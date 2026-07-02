import "server-only";
import { sql } from "../admin/db";
import { normalisePhone } from "./phone";

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
  isFirstOrder?: boolean;
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

// Postgres (postgres.js) returns numeric/bigint columns as strings; SQLite
// returns numbers. Normalise the money/stock fields we do arithmetic or
// comparisons on so behaviour is identical on both drivers. Number(x) is an
// exact no-op for values already numeric.
function num(v: unknown): number {
  return Number(v ?? 0);
}
function numOrNull(v: unknown): number | null {
  return v == null ? null : Number(v);
}

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
export async function priceCart(
  lines: CartLineInput[],
  promoCode?: string | null,
  customerEmail?: string | null,
  customerPhone?: string | null,
): Promise<PriceResult> {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: "Your bag is empty." };
  }
  if (lines.length > 50) return { ok: false, error: "Too many items in one order." };

  const priced: PricedLine[] = [];
  for (const raw of lines) {
    const slug = String(raw.slug ?? "").trim();
    const qty = Number(raw.qty);
    if (!slug || !Number.isFinite(qty) || qty <= 0) {
      return { ok: false, error: "Invalid item in your bag." };
    }
    const pRow = await sql.get<ProductRow>(
      "SELECT slug, name, price, sale_price, kind, status, category FROM products WHERE slug = ?",
      [slug],
    );
    if (!pRow) return { ok: false, error: `“${slug}” is no longer available.` };
    if (pRow.status !== "active") {
      return { ok: false, error: `“${pRow.name}” is currently unavailable.` };
    }
    const p: ProductRow = {
      ...pRow,
      price: num(pRow.price),
      sale_price: numOrNull(pRow.sale_price),
    };

    const isFabric = p.kind === "fabric";
    const unit = effectiveUnitPrice(p);

    if (isFabric) {
      const colour = (raw.colour ?? "").toString().trim();
      if (!colour) return { ok: false, error: `Choose a colour for ${p.name}.` };
      const c = await sql.get<{ stock_meters: number }>(
        "SELECT stock_meters FROM fabric_colours WHERE product_slug = ? AND name = ?",
        [slug, colour],
      );
      if (!c) return { ok: false, error: `${p.name} — colour “${colour}” unavailable.` };
      const stockMeters = num(c.stock_meters);
      if (stockMeters < qty) {
        return { ok: false, error: `Only ${stockMeters}m of ${p.name} (${colour}) left.` };
      }
      priced.push({
        slug, name: p.name, qty, unit_price: unit, size: null, colour,
        is_fabric: true, line_total: Math.round(unit * qty), category: p.category,
      });
    } else {
      const size = (raw.size ?? "").toString().trim() || null;
      const inv = await sql.get<{ stock: number; oos_flag: number }>(
        "SELECT stock, oos_flag FROM inventory WHERE product_slug = ? AND size = ?",
        [slug, size ?? ""],
      );
      // No inventory row ⇒ untracked size; treat as unavailable to be safe.
      if (!inv || num(inv.oos_flag) === 1 || num(inv.stock) < qty) {
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
  let isFirstOrder = false;
  if (promoCode && promoCode.trim()) {
    const v = await validatePromo(promoCode.trim(), priced, subtotal, customerEmail ?? null, customerPhone ?? null);
    if (!v.ok) return { ok: false, error: v.error };
    discount = v.discount;
    waiveShipping = v.waiveShipping;
    appliedPromo = v.code;
    isFirstOrder = v.isFirstOrder;
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
    pricing: { subtotal, discount, shipping, tax, total, promo_code: appliedPromo, isFirstOrder },
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
  first_order_only: number;
};

type PromoCheck =
  | { ok: true; code: string; discount: number; waiveShipping: boolean; isFirstOrder: boolean }
  | { ok: false; error: string };

export async function validatePromo(
  code: string,
  lines: PricedLine[],
  subtotal: number,
  customerEmail?: string | null,
  customerPhone?: string | null,
): Promise<PromoCheck> {
  const promoRow = await sql.get<PromoRow>(
    "SELECT * FROM promotions WHERE code = ?",
    [code],
  );
  if (!promoRow) return { ok: false, error: "Invalid promo code." };
  if (promoRow.status !== "active") return { ok: false, error: "This code is not active." };

  const promo: PromoRow = {
    ...promoRow,
    value: num(promoRow.value),
    min_total: num(promoRow.min_total),
    usage_limit: numOrNull(promoRow.usage_limit),
    usage_count: num(promoRow.usage_count),
    first_order_only: num(promoRow.first_order_only),
  };

  // First-order-only check: customer must have zero completed orders and no
  // active claim. This is a soft check (UX feedback); the hard guarantee is
  // the UNIQUE constraint on first_order_claims.customer_id at order creation.
  if (promo.first_order_only) {
    if (!customerEmail) {
      return { ok: false, error: "Enter your email first to use this code." };
    }
    const email = customerEmail.trim().toLowerCase();
    const customer = await sql.get<{ id: number | string; total_orders: number | string }>(
      "SELECT id, total_orders FROM customers WHERE LOWER(email) = ?",
      [email],
    );
    if (customer && Number(customer.total_orders) > 0) {
      return { ok: false, error: "This code is valid for first orders only." };
    }
    // Check if there's already an active claim (pending order with this promo)
    if (customer) {
      const existingClaim = await sql.get<{ id: number | string }>(
        "SELECT id FROM first_order_claims WHERE customer_id = ? AND status = 'pending'",
        [Number(customer.id)],
      );
      if (existingClaim) {
        return { ok: false, error: "You already have an order in progress with this discount." };
      }
    }

    // Phone-based check: catches multi-email abuse (same phone, different email)
    if (customerPhone) {
      const normPhone = normalisePhone(customerPhone);
      if (normPhone) {
        const byPhone = await sql.get<{ id: number | string; total_orders: number | string }>(
          "SELECT id, total_orders FROM customers WHERE phone = ? AND total_orders > 0",
          [normPhone],
        );
        if (byPhone) {
          return { ok: false, error: "This code is valid for first orders only." };
        }
        // Also check pending claims by phone
        const pendingByPhone = await sql.get<{ id: number | string }>(
          `SELECT fc.id FROM first_order_claims fc
           JOIN customers c ON c.id = fc.customer_id
           WHERE c.phone = ? AND fc.status = 'pending'`,
          [normPhone],
        );
        if (pendingByPhone) {
          return { ok: false, error: "You already have an order in progress with this discount." };
        }
      }
    }
  }

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
  const targets = await sql.all<{ target_type: string; target_id: string }>(
    "SELECT target_type, target_id FROM offer_targets WHERE promo_code = ?",
    [code],
  );
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
    return { ok: true, code: promo.code, discount: 0, waiveShipping: true, isFirstOrder: !!promo.first_order_only };
  }
  const discount =
    promo.type === "percent"
      ? Math.round((eligible * promo.value) / 100)
      : Math.min(promo.value, eligible);
  return { ok: true, code: promo.code, discount, waiveShipping: false, isFirstOrder: !!promo.first_order_only };
}
