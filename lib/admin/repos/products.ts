import "server-only";
import { sql } from "../db";
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

export async function listProducts(f: ListFilter = {}): Promise<Product[]> {
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
  const query = `SELECT * FROM products ${
    where.length ? "WHERE " + where.join(" AND ") : ""
  } ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
  params.push(f.limit ?? 100, f.offset ?? 0);
  const rows = await sql.all<ProductRow>(query, params);
  return rows.map(rowToProduct);
}

export async function countProducts(f: ListFilter = {}): Promise<number> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.kind) { where.push("kind = ?"); params.push(f.kind); }
  if (f.status && f.status !== "all") { where.push("status = ?"); params.push(f.status); }
  if (f.q) {
    where.push("(name LIKE ? OR slug LIKE ?)");
    params.push(`%${f.q}%`, `%${f.q}%`);
  }
  const query = `SELECT COUNT(*) as n FROM products ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  const row = await sql.get<{ n: number | string }>(query, params);
  return Number(row?.n ?? 0);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const row = await sql.get<ProductRow>("SELECT * FROM products WHERE slug = ?", [slug]);
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

export async function upsertProduct(input: ProductInput): Promise<void> {
  await sql.run(
    `INSERT INTO products (
      slug, name, cat, cat_link, price, sale_price, line,
      sizes_json, features_json, spec_json, note, fit, fabric,
      occasion, badge, gender, category, sub, kind, status, description, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      CURRENT_TIMESTAMP
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
      updated_at = CURRENT_TIMESTAMP`,
    [
      input.slug,
      input.name,
      input.cat,
      input.cat_link,
      input.price,
      input.sale_price,
      input.line,
      JSON.stringify(input.sizes),
      JSON.stringify(input.features),
      JSON.stringify(input.spec),
      input.note,
      input.fit,
      input.fabric,
      input.occasion,
      input.badge,
      input.gender,
      input.category,
      input.sub,
      input.kind,
      input.status,
      input.description,
    ],
  );
}

export async function deleteProduct(slug: string): Promise<void> {
  await sql.run("DELETE FROM products WHERE slug = ?", [slug]);
}

export async function setStatus(slug: string, status: ProductStatus): Promise<void> {
  await sql.run(
    `UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?`,
    [status, slug],
  );
}

export async function getInventory(slug: string): Promise<InventoryRow[]> {
  return sql.all<InventoryRow>(
    "SELECT * FROM inventory WHERE product_slug = ? ORDER BY size ASC",
    [slug],
  );
}

export async function setInventory(
  slug: string,
  rows: Array<{ size: string; stock: number; oos_flag: number }>,
): Promise<void> {
  await sql.tx(async (t) => {
    await t.run("DELETE FROM inventory WHERE product_slug = ?", [slug]);
    for (const r of rows) {
      await t.run(
        "INSERT INTO inventory (product_slug, size, stock, oos_flag) VALUES (?, ?, ?, ?)",
        [slug, r.size, r.stock, r.oos_flag],
      );
    }
  });
}

export type StockMatrixRow = {
  slug: string;
  name: string;
  kind: string;
  status: ProductStatus;
  sizes: Array<{ size: string; stock: number; oos: number }>;
  total: number;
};

export async function getStockMatrix(filter?: { kind?: "tailored" | "fabric" }): Promise<StockMatrixRow[]> {
  const query = `SELECT slug, name, kind, status FROM products
               ${filter?.kind ? "WHERE kind = ?" : ""}
               ORDER BY name ASC`;
  const rows = await sql.all<{ slug: string; name: string; kind: string; status: ProductStatus }>(
    query,
    filter?.kind ? [filter.kind] : [],
  );
  const out: StockMatrixRow[] = [];
  for (const r of rows) {
    const sizes = await sql.all<{ size: string; stock: number; oos: number }>(
      "SELECT size, stock, oos_flag as oos FROM inventory WHERE product_slug = ? ORDER BY size",
      [r.slug],
    );
    out.push({
      ...r,
      sizes,
      total: sizes.reduce((a, s) => a + Number(s.stock), 0),
    });
  }
  return out;
}
