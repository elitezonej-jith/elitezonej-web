import "server-only";
import postgres from "postgres";

/**
 * Async Postgres data layer — the cutover target for the better-sqlite3
 * in-memory blocker (see docs/postgres-migration-plan.md).
 *
 * DORMANT: nothing imports this yet. `lib/admin/db.ts` (sqlite, sync) is
 * still the only active path. Activation = porting the 24 repos to `await`
 * these verbs and flipping `DB_DRIVER=postgres` once `DATABASE_URL` exists.
 *
 * Verbs deliberately mirror the better-sqlite3 surface
 * (`prepare().get/all/run`, `db.transaction`) so the repo port is mechanical.
 */

let client: postgres.Sql | null = null;

function db(): postgres.Sql {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — Postgres path is unconfigured. Keep " +
        "DB_DRIVER=sqlite until a pooled Postgres URL is provisioned.",
    );
  }
  // Small pool: Fluid Compute reuses instances and Neon's pooler fans out,
  // so a large per-instance pool is wrong here.
  client = postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 3),
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // transaction-mode pooler (PgBouncer) — no session prepared stmts
  });
  return client;
}

/**
 * Rewrites SQLite-style positional `?` placeholders to Postgres `$n`,
 * skipping `?` inside single-quoted string literals. Our repo SQL uses only
 * positional `?` (verified: no literal `?` in any statement), so this is
 * safe; new SQL must keep that invariant.
 */
export function toPg(text: string): string {
  let out = "";
  let i = 0;
  let n = 0;
  let inStr = false;
  for (const ch of text) {
    if (ch === "'") inStr = !inStr;
    if (ch === "?" && !inStr) {
      n += 1;
      out += `$${n}`;
    } else {
      out += ch;
    }
    i += 1;
  }
  return out;
}

type Params = readonly unknown[];

export const sql = {
  async get<T = Record<string, unknown>>(text: string, params: Params = []): Promise<T | null> {
    const rows = await db().unsafe(toPg(text), params as unknown as never[]);
    return (rows[0] as T) ?? null;
  },

  async all<T = Record<string, unknown>>(text: string, params: Params = []): Promise<T[]> {
    const rows = await db().unsafe(toPg(text), params as unknown as never[]);
    return rows as unknown as T[];
  },

  /** INSERT/UPDATE/DELETE. Append `RETURNING id` to recover the old
   *  `lastInsertRowid`; `count` replaces better-sqlite3 `.changes`. */
  async run(
    text: string,
    params: Params = [],
  ): Promise<{ count: number; rows: Record<string, unknown>[] }> {
    const res = await db().unsafe(toPg(text), params as unknown as never[]);
    return { count: res.count ?? res.length, rows: res as unknown as Record<string, unknown>[] };
  },

  /** Single atomic transaction. Mirrors better-sqlite3 `db.transaction()`:
   *  throwing inside `fn` rolls everything back. */
  async tx<T>(fn: (t: postgres.TransactionSql) => Promise<T>): Promise<T> {
    return db().begin(fn) as Promise<T>;
  },
};

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end({ timeout: 5 });
    client = null;
  }
}
