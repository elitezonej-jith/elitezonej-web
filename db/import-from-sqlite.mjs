// One-shot: copy AUTHORED CONTENT + CATALOG from the local SQLite dev DB
// (data/admin.db) into Postgres. Deliberately EXCLUDES transactional/sample
// tables (orders, order_items, customers, bookings, payments, *sessions,
// audit_log, webhook_events, checkout_idempotency) and `users` — those are
// seed fixtures / security state and must not pollute a live shop.
//
//   DATABASE_URL='<verify-branch url>' node db/import-from-sqlite.mjs   # rehearse
//   DATABASE_URL='<prod url>'          node db/import-from-sqlite.mjs   # real
//
// Idempotent: ON CONFLICT (pk) DO NOTHING (settings: DO UPDATE). Re-runnable.
// Runs in ONE transaction — all-or-nothing. Introspects column / PK / identity
// metadata from the target so it can't drift from the schema.
import Database from "better-sqlite3";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set."); process.exit(1); }

// FK-safe order. categories handled specially (self-ref parent_id).
const TABLES = [
  "settings",
  "categories",
  "products",
  "inventory",
  "fabric_meta",
  "fabric_colours",
  "product_meta",
  "product_images",
  "promotions",
  "offer_targets",
  "banners",
  "notices",
  "homepage_blocks",
  "home_sections",
  "flash_sales",
  "media",
  "media_assets",
];

const sdb = new Database("data/admin.db", { readonly: true });
const sql = postgres(url, { max: 1, prepare: false });

const sqliteCols = (t) => {
  try { return sdb.prepare(`PRAGMA table_info("${t}")`).all().map((r) => r.name); }
  catch { return []; }
};
const sqliteRows = (t, order) =>
  sdb.prepare(`SELECT * FROM "${t}"${order ? ` ORDER BY ${order}` : ""}`).all();

async function pgMeta(tx, t) {
  const cols = await tx`
    SELECT column_name, is_identity FROM information_schema.columns
    WHERE table_schema='public' AND table_name=${t}`;
  const pk = await tx`
    SELECT a.attname FROM pg_index i
    JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = ${t}::regclass AND i.indisprimary`;
  return {
    cols: new Map(cols.map((c) => [c.column_name, c.is_identity === "YES"])),
    pk: pk.map((r) => r.attname),
  };
}

const q = (id) => `"${id.replace(/"/g, '""')}"`;

async function copy(tx, t, { rows, cols, meta, override }) {
  if (rows.length === 0) return 0;
  const colList = cols.map(q).join(", ");
  const ph = cols.map((_, i) => `$${i + 1}`).join(", ");
  const ov = override ? " OVERRIDING SYSTEM VALUE" : "";
  const conflict =
    t === "settings"
      ? `ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value"`
      : meta.pk.length
        ? `ON CONFLICT (${meta.pk.map(q).join(", ")}) DO NOTHING`
        : "";
  const text = `INSERT INTO ${q(t)} (${colList})${ov} VALUES (${ph}) ${conflict}`;
  let n = 0;
  for (const row of rows) {
    const r = await tx.unsafe(text, cols.map((c) => row[c] ?? null));
    n += r.count ?? 0;
  }
  return n;
}

try {
  const summary = [];
  await sql.begin(async (tx) => {
    for (const t of TABLES) {
      const scols = sqliteCols(t);
      if (scols.length === 0) { summary.push([t, "—", "no local table"]); continue; }
      const meta = await pgMeta(tx, t);
      if (meta.cols.size === 0) { summary.push([t, "—", "no pg table"]); continue; }
      // Only columns present on BOTH sides.
      const cols = scols.filter((c) => meta.cols.has(c));
      const idIsIdentity = cols.includes("id") && meta.cols.get("id") === true;

      if (t === "categories") {
        // Self-referential (parent_id → categories.id). Keep the REAL
        // parent_id (stripping it would collapse rows that are unique only
        // by parent — e.g. "brooches" under both Men and Women — and trip
        // uq_categories_slug_parent). Insert in waves: a row goes in once
        // its parent is already in, so the self-FK + unique hold exactly as
        // in the source (which enforces the same constraint, so data is
        // guaranteed valid). Ids preserved via OVERRIDING SYSTEM VALUE.
        const all = sqliteRows(t, "id ASC");
        const done = new Set();
        let remaining = all.slice();
        let n = 0;
        let guard = 0;
        while (remaining.length) {
          const ready = remaining.filter(
            (r) => r.parent_id == null || done.has(r.parent_id),
          );
          if (ready.length === 0) {
            throw new Error(
              `categories: unresolved parent order for ids ${remaining
                .map((r) => r.id)
                .join(",")}`,
            );
          }
          n += await copy(tx, t, {
            rows: ready, cols, meta, override: idIsIdentity,
          });
          ready.forEach((r) => done.add(r.id));
          remaining = remaining.filter((r) => !done.has(r.id));
          if (++guard > all.length + 2) {
            throw new Error("categories: ordering guard tripped");
          }
        }
        summary.push([t, n, `${all.length} read`]);
      } else {
        const order = meta.cols.has("id") ? "id ASC" : null;
        const rows = sqliteRows(t, order);
        const n = await copy(tx, t, { rows, cols, meta, override: idIsIdentity });
        summary.push([t, n, `${rows.length} read`]);
      }

      // Keep identity sequences ahead of the copied ids.
      if (idIsIdentity) {
        await tx.unsafe(
          `SELECT setval(pg_get_serial_sequence('${t}','id'),
             GREATEST((SELECT COALESCE(MAX(id),1) FROM ${q(t)}), 1))`,
        );
      }
    }
  });

  console.log("\n table                inserted   source");
  console.log(" ---------------------------------------------");
  for (const [t, n, note] of summary)
    console.log(` ${t.padEnd(20)} ${String(n).padStart(8)}   ${note}`);
  console.log(
    "\nExcluded by design (fixtures/security): orders, order_items,",
    "customers, bookings, payments, sessions, customer_sessions,",
    "audit_log, webhook_events, checkout_idempotency, users.",
  );
  console.log("Done (single transaction committed).");
} catch (err) {
  console.error("\nimport FAILED — transaction rolled back, nothing written:");
  console.error(err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
  sdb.close();
}
