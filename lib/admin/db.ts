import "server-only";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DEFAULT_ADMIN_EMAIL = "admin@elitezonej.com";
const DEFAULT_ADMIN_NAME = "Admin";
const DEFAULT_STAFF_EMAIL = "studio@elitezonej.com";
const DEFAULT_STAFF_NAME = "Studio Operator";

declare global {
  // eslint-disable-next-line no-var
  var __ezj_admin_db: Database.Database | undefined;
}

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "admin.db");
const SCHEMA_PATH = path.resolve(process.cwd(), "lib/admin/schema.sql");
const SCHEMA_V2_PATH = path.resolve(process.cwd(), "lib/admin/schema-v2.sql");
const SCHEMA_V3_PATH = path.resolve(process.cwd(), "lib/admin/schema-v3.sql");
const SCHEMA_V4_PATH = path.resolve(process.cwd(), "lib/admin/schema-v4.sql");
const SCHEMA_V5_PATH = path.resolve(process.cwd(), "lib/admin/schema-v5.sql");
const SCHEMA_V6_PATH = path.resolve(process.cwd(), "lib/admin/schema-v6.sql");
const SCHEMA_V7_PATH = path.resolve(process.cwd(), "lib/admin/schema-v7.sql");
const SCHEMA_V8_PATH = path.resolve(process.cwd(), "lib/admin/schema-v8.sql");
const SCHEMA_V9_PATH = path.resolve(process.cwd(), "lib/admin/schema-v9.sql");
const SCHEMA_V10_PATH = path.resolve(process.cwd(), "lib/admin/schema-v10.sql");
const SCHEMA_V11_PATH = path.resolve(process.cwd(), "lib/admin/schema-v11.sql");

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
const SCHEMA_V4_STATEMENTS = parseStatements(SCHEMA_V4_PATH);
const SCHEMA_V5_STATEMENTS = parseStatements(SCHEMA_V5_PATH);
const SCHEMA_V6_STATEMENTS = parseStatements(SCHEMA_V6_PATH);
const SCHEMA_V7_STATEMENTS = parseStatements(SCHEMA_V7_PATH);
const SCHEMA_V8_STATEMENTS = parseStatements(SCHEMA_V8_PATH);
const SCHEMA_V9_STATEMENTS = parseStatements(SCHEMA_V9_PATH);
const SCHEMA_V10_STATEMENTS = parseStatements(SCHEMA_V10_PATH);
const SCHEMA_V11_STATEMENTS = parseStatements(SCHEMA_V11_PATH);

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

/**
 * One-time repair: schema-v7 originally used BIGSERIAL (Postgres syntax) for
 * the category_filters/filter_options tables. SQLite silently accepts the type
 * name but does NOT auto-generate IDs — every row gets id=NULL, breaking FK
 * relationships. If we detect the broken schema (table exists but the id
 * column type is not "INTEGER"), drop both tables so schema-v7 can recreate
 * them correctly. Data loss is zero because any rows written under the broken
 * schema have NULL PKs and NULL FK references — they were never usable.
 */
function repairBrokenFilterTables(db: Database.Database): void {
  try {
    const cols = db.prepare("PRAGMA table_info(category_filters)").all() as Array<{
      name: string; type: string; pk: number;
    }>;
    if (!cols.length) return; // table doesn't exist yet — nothing to repair
    const idCol = cols.find((c) => c.name === "id");
    // SQLite only auto-generates rowid when the type is exactly "INTEGER".
    // If it's "BIGSERIAL" or anything else, the table is broken.
    if (idCol && idCol.type.toUpperCase() === "INTEGER") return; // already fixed
    // eslint-disable-next-line no-console
    console.warn("[db] Repairing broken category_filters/filter_options tables (BIGSERIAL → INTEGER)");
    db.exec("DROP TABLE IF EXISTS filter_options");
    db.exec("DROP TABLE IF EXISTS category_filters");
  } catch {
    // Table doesn't exist or can't be inspected — schema-v7 will create it.
  }
}

function ensureDefaultAdmin(db: Database.Database): void {
  // Skip entirely if both accounts already exist — avoids expensive bcrypt
  // hashing (~750ms per hash at cost 12) on every DB open / hot-reload.
  const existing = db.prepare(
    `SELECT COUNT(*) as n FROM users WHERE email IN (?, ?)`,
  ).get(DEFAULT_ADMIN_EMAIL, DEFAULT_STAFF_EMAIL) as { n: number };
  if (existing.n >= 2) return;

  const ownerExists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(DEFAULT_ADMIN_EMAIL);
  if (!ownerExists) {
    const ownerPw = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "Admin@123";
    const ownerHash = bcrypt.hashSync(ownerPw, 12).replace(/^\$2b\$/, "$2a$");
    db.prepare(
      `INSERT OR IGNORE INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'owner')`,
    ).run(DEFAULT_ADMIN_EMAIL, ownerHash, DEFAULT_ADMIN_NAME);
  }

  const staffExists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(DEFAULT_STAFF_EMAIL);
  if (!staffExists) {
    const staffPw = process.env.STAFF_BOOTSTRAP_PASSWORD ?? "Studio@123";
    const staffHash = bcrypt.hashSync(staffPw, 12).replace(/^\$2b\$/, "$2a$");
    db.prepare(
      `INSERT OR IGNORE INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'staff')`,
    ).run(DEFAULT_STAFF_EMAIL, staffHash, DEFAULT_STAFF_NAME);
  }
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

function removeDeprecatedHomepageBlocks(db: Database.Database): void {
  try {
    const done = db
      .prepare("SELECT value FROM settings WHERE key = 'removed_service_cards_v1'")
      .get() as { value: string } | undefined;
    if (done) return;
    db.prepare("DELETE FROM homepage_blocks WHERE type = 'service_cards'").run();
    db.prepare(
      "INSERT INTO settings (key, value) VALUES ('removed_service_cards_v1', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    ).run();
  } catch {
    // homepage_blocks may not exist yet on a very early schema pass.
  }
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
  applyAdditive(db, SCHEMA_V4_STATEMENTS, "schema-v4");
  applyAdditive(db, SCHEMA_V5_STATEMENTS, "schema-v5");
  applyAdditive(db, SCHEMA_V6_STATEMENTS, "schema-v6");
  // Repair: if category_filters exists with a broken schema (BIGSERIAL instead
  // of INTEGER PRIMARY KEY AUTOINCREMENT), the id column won't auto-generate.
  // Drop and let schema-v7 recreate. Any data under the old schema is unusable
  // (NULL PKs), so the drop is non-destructive.
  repairBrokenFilterTables(db);
  applyAdditive(db, SCHEMA_V7_STATEMENTS, "schema-v7");
  applyAdditive(db, SCHEMA_V8_STATEMENTS, "schema-v8");
  applyAdditive(db, SCHEMA_V9_STATEMENTS, "schema-v9");
  applyAdditive(db, SCHEMA_V10_STATEMENTS, "schema-v10");
  applyAdditive(db, SCHEMA_V11_STATEMENTS, "schema-v11");

  // Seed the static owner account if missing — runs before catalog seed so
  // the first /admin visit can log straight in without going through /setup.
  ensureDefaultAdmin(db);
  removeDeprecatedHomepageBlocks(db);

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
  if (process.env.DB_DRIVER === "postgres") {
    throw new Error("getDb() is not available in Postgres mode. Use async sql.");
  }
  // Fail-loud guard: refuse to silently fall back to ephemeral SQLite on a
  // serverless deployment. If we reach here on Vercel it means DB_DRIVER was
  // unset/misspelled — the user-visible alternative is "site appears to work
  // but orders/sessions vanish every 15 min", which is much worse than a
  // hard 500 on every request until the env is fixed.
  if (IS_SERVERLESS) {
    throw new Error(
      "[db] Serverless runtime without DB_DRIVER=postgres. Refusing to fall " +
        "back to ephemeral in-memory SQLite (data would not survive cold " +
        "starts). Set DB_DRIVER=postgres and a valid DATABASE_URL in the " +
        "Vercel project env vars, then redeploy.",
    );
  }
  if (!global.__ezj_admin_db) global.__ezj_admin_db = open();
  return global.__ezj_admin_db;
}

import { sql as pgSql, toPg } from "../db/sql";

type Params = readonly unknown[];

/**
 * Driver-agnostic async data interface. Repos are written against this so the
 * SQLite (local dev) and Postgres (preview/prod) paths are behaviourally
 * identical. Inserts that need the new id MUST use `… RETURNING id` (works on
 * both better-sqlite3 ≥ the bundled version and Postgres) — never
 * `lastInsertRowid`, which has no Postgres equivalent.
 */
export interface SqlClient {
  get<T = Record<string, unknown>>(text: string, params?: Params): Promise<T | null>;
  all<T = Record<string, unknown>>(text: string, params?: Params): Promise<T[]>;
  run(
    text: string,
    params?: Params,
  ): Promise<{ count: number; rows: Record<string, unknown>[] }>;
  tx<T>(fn: (t: SqlClient) => Promise<T>): Promise<T>;
}

const sqliteSql: SqlClient = {
  async get<T = Record<string, unknown>>(text: string, params: Params = []): Promise<T | null> {
    return (getDb().prepare(text).get(...params) as T) ?? null;
  },
  async all<T = Record<string, unknown>>(text: string, params: Params = []): Promise<T[]> {
    return getDb().prepare(text).all(...params) as T[];
  },
  async run(
    text: string,
    params: Params = [],
  ): Promise<{ count: number; rows: Record<string, unknown>[] }> {
    const stmt = getDb().prepare(text);
    // `stmt.reader` is true when the statement yields rows — i.e. it has a
    // RETURNING clause. better-sqlite3 only surfaces those rows via .all()/
    // .get(); .run() would silently drop them, breaking every id-returning
    // INSERT on the SQLite path. Mirror the Postgres shim's { count, rows }.
    if (stmt.reader) {
      const rows = stmt.all(...params) as Record<string, unknown>[];
      return { count: rows.length, rows };
    }
    const res = stmt.run(...params);
    return { count: res.changes, rows: [] };
  },
  async tx<T>(fn: (t: SqlClient) => Promise<T>): Promise<T> {
    // SQLite path is single-process LOCAL DEV ONLY (locked decision: prod is
    // DB_DRIVER=postgres). better-sqlite3 is synchronous and there is one
    // shared connection, so BEGIN IMMEDIATE takes the write lock up front and
    // the body runs to completion before any other request can write. Genuine
    // multi-instance transactional integrity rides on the Postgres tx
    // (postgres.js `begin`), not this.
    const db = getDb();
    db.exec("BEGIN IMMEDIATE");
    try {
      const res = await fn(sqliteSql);
      db.exec("COMMIT");
      return res;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  },
};

// Postgres path. `pgSql` (lib/db/sql.ts) already exposes get/all/run, but its
// `tx` hands the callback a postgres.js TransactionSql (tagged-template), not a
// SqlClient. Adapt that transaction handle into a SqlClient so repo
// transaction bodies are written once, driver-agnostically — same `toPg`
// (?→$n) rewrite as the non-tx path, single source of truth in lib/db/sql.ts.
const pgClient: SqlClient = {
  get: pgSql.get,
  all: pgSql.all,
  run: pgSql.run,
  tx<T>(fn: (t: SqlClient) => Promise<T>): Promise<T> {
    return pgSql.tx(async (t) => {
      const txClient: SqlClient = {
        async get<R = Record<string, unknown>>(text: string, params: Params = []) {
          const rows = await t.unsafe(toPg(text), params as unknown as never[]);
          return ((rows[0] as R) ?? null) as R | null;
        },
        async all<R = Record<string, unknown>>(text: string, params: Params = []) {
          const rows = await t.unsafe(toPg(text), params as unknown as never[]);
          return rows as unknown as R[];
        },
        async run(text: string, params: Params = []) {
          const res = await t.unsafe(toPg(text), params as unknown as never[]);
          return {
            count: res.count ?? res.length,
            rows: res as unknown as Record<string, unknown>[],
          };
        },
        tx() {
          // Postgres.js does support savepoints, but the repo layer never
          // nests sql.tx — fail loud rather than silently flatten.
          throw new Error("Nested sql.tx() is not supported.");
        },
      };
      return fn(txClient);
    });
  },
};

export const sql: SqlClient =
  process.env.DB_DRIVER === "postgres" ? pgClient : sqliteSql;

/**
 * Durable persistence gate (RF-7) — the condition under which live money may
 * be taken. True iff the Postgres driver is active AND a fresh connectivity
 * probe confirms the migrated schema is reachable. This REPLACES the old
 * platform-keyed `isEphemeralPersistence()` hard-disable: that signal keyed
 * off `VERCEL===1` and would have wrongly blocked live payments on a
 * perfectly durable Postgres-on-Vercel deployment.
 *
 * Fail-closed by construction: DB_DRIVER not postgres, no DATABASE_URL, an
 * unreachable database, or a missing migration table all return `false`, so
 * `createProviderOrder` refuses rather than accept money it cannot durably
 * record. Probed per call (not cached) so a DB that goes down mid-life
 * immediately re-closes the gate.
 */
export async function isDurablePersistence(): Promise<boolean> {
  if (process.env.DB_DRIVER !== "postgres") return false;
  try {
    await pgSql.get("SELECT 1");
    const m = await pgSql.get<{ n: number | string }>(
      "SELECT count(*) AS n FROM schema_migrations",
    );
    return Number(m?.n ?? 0) >= 1;
  } catch {
    return false;
  }
}

/**
 * Ensures the default admin (owner) and studio (staff) accounts exist with
 * known credentials. Works on both SQLite and Postgres via the async sql client.
 * Idempotent — safe to call on every cold start.
 */
export async function ensureDefaultUsersAsync(): Promise<void> {
  // Fast-path: skip if both accounts already exist (avoids ~1.5s of bcrypt).
  const existingOwner = await sql.get<{ id: number }>("SELECT id FROM users WHERE email = ?", [DEFAULT_ADMIN_EMAIL]);
  const existingStaff = await sql.get<{ id: number }>("SELECT id FROM users WHERE email = ?", [DEFAULT_STAFF_EMAIL]);
  if (existingOwner && existingStaff) return;

  if (!existingOwner) {
    const ownerPw = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "Admin@123";
    const ownerHash = bcrypt.hashSync(ownerPw, 12).replace(/^\$2b\$/, "$2a$");
    await sql.run(
      `INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'owner')`,
      [DEFAULT_ADMIN_EMAIL, ownerHash, DEFAULT_ADMIN_NAME],
    );
  }
  if (!existingStaff) {
    const staffPw = process.env.STAFF_BOOTSTRAP_PASSWORD ?? "Studio@123";
    const staffHash = bcrypt.hashSync(staffPw, 12).replace(/^\$2b\$/, "$2a$");
    await sql.run(
      `INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'staff')`,
      [DEFAULT_STAFF_EMAIL, staffHash, DEFAULT_STAFF_NAME],
    );
  }
}
