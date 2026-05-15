import "server-only";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_ADMIN_EMAIL = "admin@elitezonej.com";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const DEFAULT_ADMIN_NAME = "Studio Owner";

declare global {
  // eslint-disable-next-line no-var
  var __ezj_admin_db: Database.Database | undefined;
}

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "admin.db");
const SCHEMA_PATH = path.resolve(process.cwd(), "lib/admin/schema.sql");
const SCHEMA_V2_PATH = path.resolve(process.cwd(), "lib/admin/schema-v2.sql");

// Read schema files once at module load instead of on every open() — keeps
// synchronous disk I/O off the request hot path on serverless cold starts.
const SCHEMA_V1_SQL = fs.readFileSync(SCHEMA_PATH, "utf8");
const SCHEMA_V2_STATEMENTS = fs.readFileSync(SCHEMA_V2_PATH, "utf8")
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

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
  for (const stmt of SCHEMA_V2_STATEMENTS) {
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

function ensureDefaultAdmin(db: Database.Database): void {
  // Static credentials so a fresh DB is immediately usable.
  // If a user with this email already exists, leave their hash alone — the
  // operator may have changed the password through /admin/settings.
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(DEFAULT_ADMIN_EMAIL) as { id: number } | undefined;
  if (existing) return;

  const hash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 12);
  db.prepare(
    `INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'owner')`,
  ).run(DEFAULT_ADMIN_EMAIL, hash, DEFAULT_ADMIN_NAME);
}

// On Vercel (and any serverless host with a read-only filesystem) we cannot
// write a SQLite file, so fall back to an in-memory DB that re-seeds on every
// cold start. The UI behaves identically; mutations just don't survive a
// redeploy or a 15-min idle timeout.
const IS_SERVERLESS = process.env.VERCEL === "1" || process.env.IS_SERVERLESS === "1";

function open(): Database.Database {
  let db: Database.Database;
  if (IS_SERVERLESS) {
    db = new Database(":memory:");
  } else {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    db = new Database(DB_PATH);
    // WAL is only meaningful for on-disk databases.
    db.pragma("journal_mode = WAL");
  }
  db.pragma("foreign_keys = ON");

  // v1 schema is idempotent (CREATE TABLE IF NOT EXISTS …) — safe on every open.
  db.exec(SCHEMA_V1_SQL);
  // v2 additions need per-statement handling for ALTER TABLE.
  applyV2(db);

  // Seed the static owner account if missing — runs before catalog seed so
  // the first /admin visit can log straight in without going through /setup.
  ensureDefaultAdmin(db);

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
