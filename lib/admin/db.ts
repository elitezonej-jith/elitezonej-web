import "server-only";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DEFAULT_ADMIN_EMAIL = "admin@elitezonej.com";
const DEFAULT_ADMIN_NAME = "Studio Owner";

declare global {
  // eslint-disable-next-line no-var
  var __ezj_admin_db: Database.Database | undefined;
}

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "admin.db");
const SCHEMA_PATH = path.resolve(process.cwd(), "lib/admin/schema.sql");
const SCHEMA_V2_PATH = path.resolve(process.cwd(), "lib/admin/schema-v2.sql");
const SCHEMA_V3_PATH = path.resolve(process.cwd(), "lib/admin/schema-v3.sql");

// Read schema files once at module load instead of on every open() — keeps
// synchronous disk I/O off the request hot path on serverless cold starts.
const SCHEMA_V1_SQL = fs.readFileSync(SCHEMA_PATH, "utf8");
function parseStatements(file: string): string[] {
  return fs.readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}
const SCHEMA_V2_STATEMENTS = parseStatements(SCHEMA_V2_PATH);
const SCHEMA_V3_STATEMENTS = parseStatements(SCHEMA_V3_PATH);

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  try {
    const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    return rows.some((r) => r.name === column);
  } catch {
    return false;
  }
}

function applyAdditive(db: Database.Database, statements: string[], tag: string): void {
  // Run statement-by-statement so we can swallow "duplicate column" errors.
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
        console.warn(`[${tag}] skipped:`, msg);
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

  // No committed secret. Use ADMIN_BOOTSTRAP_PASSWORD if provided, else mint a
  // random one-time password and print it once so a fresh DB stays usable.
  const envPw = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const password =
    envPw && envPw.length >= 8 ? envPw : crypto.randomBytes(18).toString("base64url");
  const hash = bcrypt.hashSync(password, 12);
  db.prepare(
    `INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'owner')`,
  ).run(DEFAULT_ADMIN_EMAIL, hash, DEFAULT_ADMIN_NAME);
  if (!envPw)
    console.warn(
      `[db] Seeded owner ${DEFAULT_ADMIN_EMAIL} with a GENERATED one-time password: ${password} — sign in and change it now (set ADMIN_BOOTSTRAP_PASSWORD to control this).`,
    );
}

// Studio-defaults seed version tracking. The parity homepage seed lives in
// seed-studio.ts (SEED_VERSION). On a version bump, existing dev DBs get the
// new parity blocks by wiping + re-seeding studio defaults once.
function getSeedVersion(db: Database.Database): number {
  try {
    const r = db
      .prepare("SELECT value FROM settings WHERE key = 'home_seed_version'")
      .get() as { value: string } | undefined;
    return r ? Number(r.value) || 0 : 0;
  } catch {
    return 0;
  }
}

function setSeedVersion(db: Database.Database, v: number): void {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('home_seed_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(String(v));
}

function reseedStudioIfStale(db: Database.Database): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { seedStudioDefaults, SEED_VERSION } =
    require("./seed-studio") as typeof import("./seed-studio");
  const blockCount = (db
    .prepare("SELECT COUNT(*) as n FROM homepage_blocks")
    .get() as { n: number }).n;
  if (blockCount > 0 && getSeedVersion(db) >= SEED_VERSION) return;
  // Dev-only parity refresh: studio defaults (homepage blocks + sample banners
  // + welcome notice) are regenerated as a set so the homepage stays 1:1 with
  // the intended design after a seed bump.
  const tx = db.transaction(() => {
    db.exec("DELETE FROM homepage_blocks; DELETE FROM banners; DELETE FROM notices;");
    seedStudioDefaults(db);
    setSeedVersion(db, SEED_VERSION);
  });
  try {
    tx();
  } catch (e) {
    console.warn("[db] studio reseed skipped:", (e as Error).message);
  }
}

// On Vercel (and any serverless host with a read-only filesystem) we cannot
// write a SQLite file, so fall back to an in-memory DB that re-seeds on every
// cold start. The UI behaves identically; mutations just don't survive a
// redeploy or a 15-min idle timeout.
const IS_SERVERLESS = process.env.VERCEL === "1" || process.env.IS_SERVERLESS === "1";

/** True when the DB is the ephemeral in-memory fallback (orders/payments do
 *  NOT survive a cold start). Callers gate real-money paths on this. */
export function isEphemeralPersistence(): boolean {
  return IS_SERVERLESS;
}

let warnedEphemeral = false;

function open(): Database.Database {
  let db: Database.Database;
  if (IS_SERVERLESS) {
    if (!warnedEphemeral) {
      warnedEphemeral = true;
      console.warn(
        "[db] EPHEMERAL IN-MEMORY DATABASE — orders, payments and sessions " +
          "are lost on every cold start/redeploy. Live payments are refused " +
          "in this mode (see lib/storefront/payments). Configure a durable " +
          "database before accepting real money.",
      );
    }
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
  // v2/v3 additions need per-statement handling for ALTER TABLE.
  applyAdditive(db, SCHEMA_V2_STATEMENTS, "schema-v2");
  applyAdditive(db, SCHEMA_V3_STATEMENTS, "schema-v3");

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
    const { seedStudioDefaults, SEED_VERSION } =
      require("./seed-studio") as typeof import("./seed-studio");
    seedStudioDefaults(db);
    setSeedVersion(db, SEED_VERSION);
  } else {
    // Existing DB: refresh studio defaults if the parity seed version moved
    // (or the homepage has no blocks yet after a schema-v2 upgrade).
    reseedStudioIfStale(db);
  }

  return db;
}

export function getDb(): Database.Database {
  if (!global.__ezj_admin_db) global.__ezj_admin_db = open();
  return global.__ezj_admin_db;
}
