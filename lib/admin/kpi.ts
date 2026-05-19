import "server-only";
import { sql } from "./db";

export type Kpis = {
  revenue30d: number;
  revenue30dPrior: number;
  orders30d: number;
  aov30d: number;
  bookings30d: number;
  bookingsNew: number;
  lowStockCount: number;
  totalActiveSkus: number;
};

export type DailyPoint = { day: string; total: number };

export type LowStockRow = {
  slug: string;
  name: string;
  size: string;
  stock: number;
  kind: string;
};

export type TopSku = {
  slug: string;
  name: string;
  units: number;
  revenue: number;
};

// SQLite stored ISO TEXT and Postgres stores timestamptz; an ISO-8601 string
// compares correctly against both. Compute the rolling-window cutoffs in JS so
// the SQL stays portable (no SQLite-only datetime('now','-N days')).
function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

export async function getKpis(): Promise<Kpis> {
  const r30 = await sql.get<{ total: number | string; orders: number | string }>(
    `SELECT COALESCE(SUM(total),0) as total, COUNT(*) as orders
       FROM orders
       WHERE status != 'cancelled' AND created_at >= ?`,
    [isoDaysAgo(30)],
  );

  const r60 = await sql.get<{ total: number | string }>(
    `SELECT COALESCE(SUM(total),0) as total
       FROM orders
       WHERE status != 'cancelled'
         AND created_at >= ?
         AND created_at <  ?`,
    [isoDaysAgo(60), isoDaysAgo(30)],
  );

  const b30 = await sql.get<{ n: number | string }>(
    `SELECT COUNT(*) as n FROM bookings WHERE created_at >= ?`,
    [isoDaysAgo(30)],
  );
  const bNew = await sql.get<{ n: number | string }>(
    `SELECT COUNT(*) as n FROM bookings WHERE status = 'new'`,
  );

  const thrRow = await sql.get<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'low_stock_threshold'",
  );
  const thr = thrRow?.value ?? "3";
  const lowStock = await sql.get<{ n: number | string }>(
    `SELECT COUNT(*) as n FROM inventory WHERE stock <= ? AND oos_flag = 0`,
    [Number(thr)],
  );
  const skus = await sql.get<{ n: number | string }>(
    "SELECT COUNT(*) as n FROM products WHERE status='active'",
  );

  const revenue30d = Number(r30?.total ?? 0);
  const orders30d = Number(r30?.orders ?? 0);
  return {
    revenue30d,
    revenue30dPrior: Number(r60?.total ?? 0),
    orders30d,
    aov30d: orders30d ? Math.round(revenue30d / orders30d) : 0,
    bookings30d: Number(b30?.n ?? 0),
    bookingsNew: Number(bNew?.n ?? 0),
    lowStockCount: Number(lowStock?.n ?? 0),
    totalActiveSkus: Number(skus?.n ?? 0),
  };
}

export async function getRevenueByDay(days = 30): Promise<DailyPoint[]> {
  const rows = await sql.all<{ day: string; total: number | string }>(
    `SELECT substr(created_at,1,10) as day, COALESCE(SUM(total),0) as total
       FROM orders
       WHERE status != 'cancelled' AND created_at >= ?
       GROUP BY day ORDER BY day ASC`,
    [isoDaysAgo(days)],
  );

  // Fill missing days with zero so the sparkline doesn't compress.
  const map = new Map(rows.map((r) => [r.day, Number(r.total)] as const));
  const out: DailyPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, total: map.get(key) ?? 0 });
  }
  return out;
}

export async function getLowStock(limit = 8): Promise<LowStockRow[]> {
  const thrRow = await sql.get<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'low_stock_threshold'",
  );
  const thr = thrRow?.value ?? "3";
  return sql.all<LowStockRow>(
    `SELECT i.product_slug as slug, p.name as name, i.size, i.stock, p.kind
       FROM inventory i JOIN products p ON p.slug = i.product_slug
       WHERE i.oos_flag = 0 AND i.stock <= ?
       ORDER BY i.stock ASC, p.name ASC LIMIT ?`,
    [Number(thr), limit],
  );
}

export async function getRecentBookings(limit = 5): Promise<Array<{
  id: number;
  first_name: string;
  last_name: string;
  city: string;
  service: string;
  status: string;
  created_at: string;
}>> {
  return sql.all<{
    id: number;
    first_name: string;
    last_name: string;
    city: string;
    service: string;
    status: string;
    created_at: string;
  }>(
    `SELECT id, first_name, last_name, city, service, status, created_at
       FROM bookings ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
}

export async function getTopSkus(days = 30, limit = 5): Promise<TopSku[]> {
  const rows = await sql.all<{
    slug: string;
    name: string;
    units: number | string;
    revenue: number | string;
  }>(
    `SELECT oi.product_slug as slug, p.name as name,
              SUM(oi.qty) as units,
              SUM(oi.qty * oi.unit_price) as revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.slug = oi.product_slug
       WHERE o.status != 'cancelled'
         AND o.created_at >= ?
       GROUP BY oi.product_slug, p.name
       ORDER BY revenue DESC LIMIT ?`,
    [isoDaysAgo(days), limit],
  );
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    units: Number(r.units),
    revenue: Number(r.revenue),
  }));
}

export async function getRecentOrders(limit = 6): Promise<Array<{
  id: string;
  status: string;
  total: number;
  created_at: string;
  customer: string;
}>> {
  return sql.all<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    customer: string;
  }>(
    `SELECT o.id, o.status, o.total, o.created_at,
              c.first_name || ' ' || c.last_name as customer
       FROM orders o JOIN customers c ON c.id = o.customer_id
       ORDER BY o.created_at DESC LIMIT ?`,
    [limit],
  );
}
