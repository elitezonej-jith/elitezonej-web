import "server-only";
import type Database from "better-sqlite3";

// Populates the dashboard with realistic mock orders, customers, bookings,
// and promo codes so the operator's first view isn't an empty slate.

const FIRST_NAMES = [
  "Aarav","Vihaan","Kabir","Reyansh","Aditya","Arjun","Vivaan","Krish","Ishaan","Rohan",
  "Aisha","Anaya","Diya","Kiara","Myra","Saanvi","Riya","Pari","Sara","Aanya",
  "Nikhil","Devika","Tanvi","Aryan","Sakshi","Zara","Ira","Shaurya","Anika",
];
const LAST_NAMES = [
  "Mehta","Kapoor","Iyer","Banerjee","Shah","Reddy","Singh","Khan","Bose","Sharma",
  "Patel","Khatri","Chaudhary","Mukherjee","Sen","Ahuja","Verma","Bhatia",
];
const CITIES = ["Delhi NCR","Mumbai","Bangalore","Hyderabad","Pune","Chennai","Kolkata","Jaipur"];

const SERVICES = [
  "Bespoke Suit",
  "Custom Sherwani",
  "Tailored Shirts",
  "Alterations",
  "Just exploring",
];

const STATUSES = ["new","confirmed","in_atelier","shipped","fulfilled","cancelled"] as const;
const BOOKING_STATUSES = ["new","contacted","scheduled","done","closed"] as const;

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

function daysAgo(d: number): string {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t.toISOString().slice(0, 19).replace("T", " ");
}

export function seedFixtures(db: Database.Database): void {
  // Customers
  const insertCustomer = db.prepare(`
    INSERT OR IGNORE INTO customers
      (email, first_name, last_name, phone, city, total_orders, total_spent, created_at)
    VALUES (?, ?, ?, ?, ?, 0, 0, ?)
  `);
  const customerIds: number[] = [];
  for (let i = 0; i < 18; i++) {
    const fn = pick(FIRST_NAMES, i + 3);
    const ln = pick(LAST_NAMES, i + 7);
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`;
    insertCustomer.run(
      email,
      fn,
      ln,
      `+91 9${(800000000 + i * 11337).toString().slice(-9)}`,
      pick(CITIES, i),
      daysAgo(120 - i * 4),
    );
    const row = db
      .prepare("SELECT id FROM customers WHERE email = ?")
      .get(email) as { id: number };
    customerIds.push(row.id);
  }

  // Orders + items — 25 orders distributed across 90 days.
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer_id, status, subtotal, tax, total, currency, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_slug, qty, unit_price, size, colour, is_fabric)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const bumpCustomer = db.prepare(`
    UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id = ?
  `);

  // Pull a small SKU pool from the freshly seeded products table.
  const skus = db
    .prepare("SELECT slug, price, sale_price, kind FROM products WHERE status='active' ORDER BY RANDOM() LIMIT 12")
    .all() as Array<{ slug: string; price: number; sale_price: number | null; kind: string }>;

  const TAILORED_SIZES = ["36","38","40","42","44","XS","S","M","L","XL"];

  const today = new Date();
  for (let i = 0; i < 25; i++) {
    const orderDate = daysAgo(Math.floor((i * 90) / 25));
    const id = `WK-${String(1000 + i).slice(-4)}`;
    const customer_id = pick(customerIds, i);
    const status = pick(STATUSES, i + (i % 3 === 0 ? 4 : 0));

    const itemCount = 1 + (i % 3);
    let subtotal = 0;
    const items: Array<[string, number, number, string | null, string | null, number]> = [];
    for (let j = 0; j < itemCount; j++) {
      const sku = pick(skus, i * 7 + j * 11);
      const qty = sku.kind === "fabric" ? 1 + (j % 4) * 0.5 : 1;
      const unit = sku.sale_price ?? sku.price;
      const total = Math.round(unit * qty);
      subtotal += total;
      items.push([
        sku.slug,
        qty,
        unit,
        sku.kind === "fabric" ? null : pick(TAILORED_SIZES, i + j),
        sku.kind === "fabric" ? "Charcoal" : null,
        sku.kind === "fabric" ? 1 : 0,
      ]);
    }
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + tax;

    insertOrder.run(
      id,
      customer_id,
      status,
      subtotal,
      tax,
      total,
      i % 6 === 0 ? "Customer requested expedited fitting." : null,
      orderDate,
      orderDate,
    );
    for (const it of items) {
      insertItem.run(id, it[0], it[1], it[2], it[3], it[4], it[5]);
    }
    if (status !== "cancelled") bumpCustomer.run(total, customer_id);
  }

  // Bookings — 6 entries with varied statuses.
  const insertBooking = db.prepare(`
    INSERT INTO bookings (first_name, last_name, phone, email, city, service, message, status, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'web', ?)
  `);
  for (let i = 0; i < 6; i++) {
    const fn = pick(FIRST_NAMES, i + 11);
    const ln = pick(LAST_NAMES, i + 5);
    insertBooking.run(
      fn,
      ln,
      `+91 9${(820000000 + i * 23999).toString().slice(-9)}`,
      `${fn.toLowerCase()}@example.com`,
      pick(CITIES, i + 2),
      pick(SERVICES, i),
      i % 2 === 0 ? "Looking for a wedding three-piece by mid-October." : null,
      pick(BOOKING_STATUSES, i),
      daysAgo(i * 3),
    );
  }
  void today;

  // Promotions.
  const insertPromo = db.prepare(`
    INSERT OR IGNORE INTO promotions (code, type, value, starts_at, ends_at, min_total, usage_limit, status, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPromo.run("WEDDING24", "percent", 10, daysAgo(30), daysAgo(-30), 25000, 200, "active", "Wedding-season 10% off, min cart ₹25,000");
  insertPromo.run("FESTIVE",   "percent", 15, daysAgo(60), daysAgo(-15), 40000, 100, "active", "Festive sherwani / lehenga 15% off");
  insertPromo.run("FREESHIP",  "free_ship", 0, null, null, 15000, null, "active", "Free shipping over ₹15,000");
  insertPromo.run("WELCOME10", "percent", 10, null, null, 0, 1000, "active", "First-order welcome 10% off");
}
