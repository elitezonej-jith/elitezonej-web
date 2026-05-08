import "server-only";
import { getDb } from "../db";
import type {
  Product,
  ProductRow,
  ProductStatus,
  InventoryRow,
} from "../types";

function rowToProduct(r: ProductRow): Product {
  return {
    ...r,
    sizes: JSON.parse(r.sizes_json) as string[],
    features: JSON.parse(r.features_json) as string[],
    spec: JSON.parse(r.spec_json) as [string, string][],
  };
}

export type ListFilter = {
  q?: string;
  kind?: "tailored" | "fabric";
  status?: ProductStatus | "all";
  gender?: string;
  category?: string;
  limit?: number;
  offset?: number;
};

export function listProducts(f: ListFilter = {}): Product[] {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.kind) {
    where.push("kind = ?");
    params.push(f.kind);
  }
  if (f.status && f.status !== "all") {
    where.push("status = ?");
    params.push(f.status);
  }
  if (f.gender) {
    where.push("gender = ?");
    params.push(f.gender);
  }
  if (f.category) {
    where.push("category = ?");
    params.push(f.category);
  }
  if (f.q) {
    where.push("(name LIKE ? OR slug LIKE ? OR cat LIKE ?)");
    params.push(`%${f.q}%`, `%${f.q}%`, `%${f.q}%`);
  }
  const sql = `SELECT * FROM products ${
    where.length ? "WHERE " + where.join(" AND ") : ""
  } ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
  params.push(f.limit ?? 100, f.offset ?? 0);
  const rows = db.prepare(sql).all(...params) as ProductRow[];
  return rows.map(rowToProduct);
}

export function countProducts(f: ListFilter = {}): number {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.kind) { where.push("kind = ?"); params.push(f.kind); }
  if (f.status && f.status !== "all") { where.push("status = ?"); params.push(f.status); }
  if (f.q) {
    where.push("(name LIKE ? OR slug LIKE ?)");
    params.push(`%${f.q}%`, `%${f.q}%`);
  }
  const sql = `SELECT COUNT(*) as n FROM products ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  return (db.prepare(sql).get(...params) as { n: number }).n;
}

export function getProduct(slug: string): Product | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM products WHERE slug = ?").get(slug) as
    | ProductRow
    | undefined;
  return row ? rowToProduct(row) : null;
}

export type ProductInput = {
  slug: string;
  name: string;
  cat: string;
  cat_link: "Men" | "Women" | "Fabrics";
  price: number;
  sale_price: number | null;
  line: string;
  sizes: string[];
  features: string[];
  spec: [string, string][];
  note: string;
  fit: string;
  fabric: string;
  occasion: string;
  badge: string | null;
  gender: "men" | "women" | "unisex";
  category: string;
  sub: string | null;
  kind: "tailored" | "fabric";
  status: ProductStatus;
  description: string | null;
};

export function upsertProduct(input: ProductInput): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO products (
      slug, name, cat, cat_link, price, sale_price, line,
      sizes_json, features_json, spec_json, note, fit, fabric,
      occasion, badge, gender, category, sub, kind, status, description, updated_at
    ) VALUES (
      @slug, @name, @cat, @cat_link, @price, @sale_price, @line,
      @sizes_json, @features_json, @spec_json, @note, @fit, @fabric,
      @occasion, @badge, @gender, @category, @sub, @kind, @status, @description,
      datetime('now')
    )
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      cat = excluded.cat,
      cat_link = excluded.cat_link,
      price = excluded.price,
      sale_price = excluded.sale_price,
      line = excluded.line,
      sizes_json = excluded.sizes_json,
      features_json = excluded.features_json,
      spec_json = excluded.spec_json,
      note = excluded.note,
      fit = excluded.fit,
      fabric = excluded.fabric,
      occasion = excluded.occasion,
      badge = excluded.badge,
      gender = excluded.gender,
      category = excluded.category,
      sub = excluded.sub,
      kind = excluded.kind,
      status = excluded.status,
      description = excluded.description,
      updated_at = datetime('now')`,
  ).run({
    ...input,
    sizes_json: JSON.stringify(input.sizes),
    features_json: JSON.stringify(input.features),
    spec_json: JSON.stringify(input.spec),
  });
}

export function deleteProduct(slug: string): void {
  getDb().prepare("DELETE FROM products WHERE slug = ?").run(slug);
}

export function setStatus(slug: string, status: ProductStatus): void {
  getDb()
    .prepare(
      `UPDATE products SET status = ?, updated_at = datetime('now') WHERE slug = ?`,
    )
    .run(status, slug);
}

export function getInventory(slug: string): InventoryRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM inventory WHERE product_slug = ? ORDER BY size ASC",
    )
    .all(slug) as InventoryRow[];
}

export function setInventory(
  slug: string,
  rows: Array<{ size: string; stock: number; oos_flag: number }>,
): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM inventory WHERE product_slug = ?").run(slug);
    const ins = db.prepare(
      "INSERT INTO inventory (product_slug, size, stock, oos_flag) VALUES (?, ?, ?, ?)",
    );
    for (const r of rows) ins.run(slug, r.size, r.stock, r.oos_flag);
  });
  tx();
}

export type StockMatrixRow = {
  slug: string;
  name: string;
  kind: string;
  status: ProductStatus;
  sizes: Array<{ size: string; stock: number; oos: number }>;
  total: number;
};

export function getStockMatrix(filter?: { kind?: "tailored" | "fabric" }): StockMatrixRow[] {
  const db = getDb();
  const sql = `SELECT slug, name, kind, status FROM products
               ${filter?.kind ? "WHERE kind = ?" : ""}
               ORDER BY name ASC`;
  const rows = (filter?.kind
    ? db.prepare(sql).all(filter.kind)
    : db.prepare(sql).all()) as Array<{ slug: string; name: string; kind: string; status: ProductStatus }>;
  const inv = db.prepare(
    "SELECT size, stock, oos_flag as oos FROM inventory WHERE product_slug = ? ORDER BY size",
  );
  return rows.map((r) => {
    const sizes = inv.all(r.slug) as Array<{ size: string; stock: number; oos: number }>;
    return {
      ...r,
      sizes,
      total: sizes.reduce((a, s) => a + s.stock, 0),
    };
  });
}
