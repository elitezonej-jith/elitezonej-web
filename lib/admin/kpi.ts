import "server-only";
import { getDb } from "./db";

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

export function getKpis(): Kpis {
  const db = getDb();
  const r30 = db
    .prepare(
      `SELECT COALESCE(SUM(total),0) as total, COUNT(*) as orders
       FROM orders
       WHERE status != 'cancelled' AND datetime(created_at) >= datetime('now','-30 days')`,
    )
    .get() as { total: number; orders: number };

  const r60 = db
    .prepare(
      `SELECT COALESCE(SUM(total),0) as total
       FROM orders
       WHERE status != 'cancelled'
         AND datetime(created_at) >= datetime('now','-60 days')
         AND datetime(created_at) <  datetime('now','-30 days')`,
    )
    .get() as { total: number };

  const b30 = db
    .prepare(
      `SELECT COUNT(*) as n FROM bookings WHERE datetime(created_at) >= datetime('now','-30 days')`,
    )
    .get() as { n: number };
  const bNew = db
    .prepare(`SELECT COUNT(*) as n FROM bookings WHERE status = 'new'`)
    .get() as { n: number };

  const thr = (db
    .prepare("SELECT value FROM settings WHERE key = 'low_stock_threshold'")
    .get() as { value: string } | undefined)?.value ?? "3";
  const lowStock = db
    .prepare(
      `SELECT COUNT(*) as n FROM inventory WHERE stock <= ? AND oos_flag = 0`,
    )
    .get(Number(thr)) as { n: number };
  const skus = db
    .prepare("SELECT COUNT(*) as n FROM products WHERE status='active'")
    .get() as { n: number };

  return {
    revenue30d: r30.total,
    revenue30dPrior: r60.total,
    orders30d: r30.orders,
    aov30d: r30.orders ? Math.round(r30.total / r30.orders) : 0,
    bookings30d: b30.n,
    bookingsNew: bNew.n,
    lowStockCount: lowStock.n,
    totalActiveSkus: skus.n,
  };
}

export function getRevenueByDay(days = 30): DailyPoint[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT substr(created_at,1,10) as day, COALESCE(SUM(total),0) as total
       FROM orders
       WHERE status != 'cancelled' AND datetime(created_at) >= datetime('now',?)
       GROUP BY day ORDER BY day ASC`,
    )
    .all(`-${days} days`) as DailyPoint[];

  // Fill missing days with zero so the sparkline doesn't compress.
  const map = new Map(rows.map((r) => [r.day, r.total]));
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

export function getLowStock(limit = 8): LowStockRow[] {
  const db = getDb();
  const thr = (db
    .prepare("SELECT value FROM settings WHERE key = 'low_stock_threshold'")
    .get() as { value: string } | undefined)?.value ?? "3";
  return db
    .prepare(
      `SELECT i.product_slug as slug, p.name as name, i.size, i.stock, p.kind
       FROM inventory i JOIN products p ON p.slug = i.product_slug
       WHERE i.oos_flag = 0 AND i.stock <= ?
       ORDER BY i.stock ASC, p.name ASC LIMIT ?`,
    )
    .all(Number(thr), limit) as LowStockRow[];
}

export function getRecentBookings(limit = 5) {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, first_name, last_name, city, service, status, created_at
       FROM bookings ORDER BY datetime(created_at) DESC LIMIT ?`,
    )
    .all(limit) as Array<{
      id: number;
      first_name: string;
      last_name: string;
      city: string;
      service: string;
      status: string;
      created_at: string;
    }>;
}

export function getTopSkus(days = 30, limit = 5): TopSku[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT oi.product_slug as slug, p.name as name,
              SUM(oi.qty) as units,
              SUM(oi.qty * oi.unit_price) as revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.slug = oi.product_slug
       WHERE o.status != 'cancelled'
         AND datetime(o.created_at) >= datetime('now', ?)
       GROUP BY oi.product_slug
       ORDER BY revenue DESC LIMIT ?`,
    )
    .all(`-${days} days`, limit) as TopSku[];
}

export function getRecentOrders(limit = 6) {
  const db = getDb();
  return db
    .prepare(
      `SELECT o.id, o.status, o.total, o.created_at,
              c.first_name || ' ' || c.last_name as customer
       FROM orders o JOIN customers c ON c.id = o.customer_id
       ORDER BY datetime(o.created_at) DESC LIMIT ?`,
    )
    .all(limit) as Array<{
      id: string;
      status: string;
      total: number;
      created_at: string;
      customer: string;
    }>;
}
