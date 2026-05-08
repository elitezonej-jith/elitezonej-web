import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

declare global {
  // eslint-disable-next-line no-var
  var __ezj_admin_db: Database.Database | undefined;
}

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "admin.db");
const SCHEMA_PATH = path.resolve(process.cwd(), "lib/admin/schema.sql");
const SCHEMA_V2_PATH = path.resolve(process.cwd(), "lib/admin/schema-v2.sql");

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  try {
    const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    return rows.some((r) => r.name === column);
  } catch {
    return false;
  }
}

function applyV2(db: Database.Database): void {
  // Run statement-by-statement so we can swallow "duplicate column" errors.
  const sql = fs.readFileSync(SCHEMA_V2_PATH, "utf8");
  // Strip line comments first so they don't break the SQL split
  const stripped = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const statements = stripped
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    try {
      // ALTER TABLE ADD COLUMN: pre-check so we skip if column exists
      const m = stmt.match(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)/i);
      if (m && hasColumn(db, m[1], m[2])) continue;
      db.exec(stmt);
    } catch (err) {
      // Tolerate already-exists errors silently — schema is idempotent.
      const msg = (err as Error).message ?? "";
      if (!/duplicate|already exists/i.test(msg)) {
        // eslint-disable-next-line no-console
        console.warn("[schema-v2] skipped:", msg);
      }
    }
  }
}

function open(): Database.Database {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // v1 schema is idempotent (CREATE TABLE IF NOT EXISTS …) — safe on every open.
  db.exec(fs.readFileSync(SCHEMA_PATH, "utf8"));
  // v2 additions need per-statement handling for ALTER TABLE.
  applyV2(db);

  // Seed catalog from lib/products.ts on first run.
  const productCount = (db
    .prepare("SELECT COUNT(*) as n FROM products")
    .get() as { n: number }).n;
  if (productCount === 0) {
    // Lazy require so we don't pull in the catalog every cold start.
    const { seedFromCatalog } = require("./seed");
    seedFromCatalog(db);
    const { seedFixtures } = require("./seed-fixtures");
    seedFixtures(db);
    const { seedStudioDefaults } = require("./seed-studio");
    seedStudioDefaults(db);
  } else {
    // Schema v2 may have been added on an older DB — top up homepage_blocks /
    // banners / notices defaults idempotently.
    const blockCount = (db.prepare("SELECT COUNT(*) as n FROM homepage_blocks").get() as { n: number }).n;
    if (blockCount === 0) {
      try {
        const { seedStudioDefaults } = require("./seed-studio");
        seedStudioDefaults(db);
      } catch {
        /* no-op */
      }
    }
  }

  return db;
}

export function getDb(): Database.Database {
  if (!global.__ezj_admin_db) global.__ezj_admin_db = open();
  return global.__ezj_admin_db;
}
