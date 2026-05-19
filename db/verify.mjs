// Postgres verification harness for the durable-DB migration (Phase 3).
//
//   DATABASE_URL='<neon verify-branch url>' node db/verify.mjs
//
// Proves the SQL semantics the async port relies on, WITHOUT touching real
// data: every behavioural check runs against CREATE TEMP TABLEs (gone on
// disconnect); the durability probe uses a single dedicated, self-deleting
// marker row in a __ezj_verify table. Safe to run against the verify branch.
// Exits non-zero if any check fails.
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const sql = postgres(url, { max: 1, prepare: false });

try {
  // 1. Migrations applied (schema is owned by versioned migrations).
  const mig = await sql`SELECT count(*)::int AS n FROM schema_migrations`;
  check("schema_migrations present (>=2)", mig[0].n >= 2, `n=${mig[0].n}`);

  // 2. Core money tables exist with expected idempotency constraints.
  const cons = await sql`
    SELECT conname FROM pg_constraint
    WHERE conrelid IN ('payments'::regclass, 'webhook_events'::regclass,
                       'checkout_idempotency'::regclass)`;
  check("payments/webhook/idempotency constraints exist", cons.length >= 3,
    `${cons.length} constraints`);

  // 3. Guarded stock decrement: UPDATE … WHERE stock >= ? must affect 0 rows
  //    when stock is insufficient (the no-oversell invariant + rollback path
  //    in fulfilOrderPaid). Tested on a TEMP table — no real data touched.
  await sql`CREATE TEMP TABLE _inv (slug text, size text, stock int)`;
  await sql`INSERT INTO _inv VALUES ('p', 'M', 3)`;
  const ok1 = await sql`UPDATE _inv SET stock = stock - 2 WHERE slug='p' AND size='M' AND stock >= 2`;
  check("guarded decrement succeeds when sufficient", ok1.count === 1, `count=${ok1.count}`);
  const ok0 = await sql`UPDATE _inv SET stock = stock - 5 WHERE slug='p' AND size='M' AND stock >= 5`;
  check("guarded decrement affects 0 rows when insufficient", ok0.count === 0, `count=${ok0.count}`);
  const left = await sql`SELECT stock FROM _inv WHERE slug='p'`;
  check("stock not driven negative", left[0].stock === 1, `stock=${left[0].stock}`);

  // 4. CASE floor (portable replacement for SQLite MAX(0,x) on fabric totals).
  const cse = await sql`SELECT CASE WHEN (5 - 10) < 0 THEN 0 ELSE (5 - 10) END AS v`;
  check("CASE floor clamps to 0", Number(cse[0].v) === 0, `v=${cse[0].v}`);

  // 5. ON CONFLICT (pk) DO NOTHING idempotency (webhook + checkout dedupe).
  await sql`CREATE TEMP TABLE _evt (event_id text PRIMARY KEY, n int DEFAULT 1)`;
  const i1 = await sql`INSERT INTO _evt (event_id) VALUES ('e1') ON CONFLICT (event_id) DO NOTHING`;
  const i2 = await sql`INSERT INTO _evt (event_id) VALUES ('e1') ON CONFLICT (event_id) DO NOTHING`;
  check("first insert recorded (count=1)", i1.count === 1, `count=${i1.count}`);
  check("replay is a no-op (count=0)", i2.count === 0, `count=${i2.count}`);

  // 6. RETURNING id works (replaces SQLite lastInsertRowid).
  await sql`CREATE TEMP TABLE _ids (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, v text)`;
  const ret = await sql`INSERT INTO _ids (v) VALUES ('x') RETURNING id`;
  check("INSERT … RETURNING id yields an id", ret.length === 1 && ret[0].id != null,
    `id=${ret?.[0]?.id}`);

  // 7. CURRENT_TIMESTAMP is a valid timestamptz (portable updated_at).
  const ts = await sql`SELECT CURRENT_TIMESTAMP AS t`;
  check("CURRENT_TIMESTAMP resolves", ts[0].t instanceof Date, `t=${ts[0].t}`);

  // 7b. RF-9 atomic claim under real concurrency. Two independent clients race
  //     the exact claim UPDATE on one order row; Postgres must let EXACTLY ONE
  //     win (count 1) and the other see count 0 — the property that prevents
  //     concurrent confirm+webhook from double-fulfilling. Uses a transient
  //     real table (temp tables aren't shared across connections), dropped after.
  await sql`CREATE TABLE IF NOT EXISTS __ezj_claim_test (id int PRIMARY KEY, payment_status text)`;
  await sql`INSERT INTO __ezj_claim_test (id, payment_status) VALUES (1, 'pending')
            ON CONFLICT (id) DO UPDATE SET payment_status = 'pending'`;
  const ca = postgres(url, { max: 1, prepare: false });
  const cb = postgres(url, { max: 1, prepare: false });
  const claimSql =
    "UPDATE __ezj_claim_test SET payment_status = 'paid' WHERE id = 1 AND payment_status <> 'paid'";
  const [ra, rb] = await Promise.all([ca.unsafe(claimSql), cb.unsafe(claimSql)]);
  await ca.end({ timeout: 5 });
  await cb.end({ timeout: 5 });
  const counts = [ra.count, rb.count].sort();
  check("RF-9 concurrent claim: exactly one winner", counts[0] === 0 && counts[1] === 1,
    `counts=${JSON.stringify([ra.count, rb.count])}`);
  await sql`DROP TABLE __ezj_claim_test`;

  // 8. Durability: write a marker, close the connection, reopen a NEW client,
  //    and read it back — proves data survives a fresh process/connection
  //    (the actual fix vs the old in-memory SQLite). Marker is then removed.
  await sql`CREATE TABLE IF NOT EXISTS __ezj_verify (k text PRIMARY KEY, at timestamptz DEFAULT now())`;
  const marker = `verify_${Date.now()}`;
  await sql`INSERT INTO __ezj_verify (k) VALUES (${marker})`;
  await sql.end({ timeout: 5 });

  const sql2 = postgres(url, { max: 1, prepare: false });
  const found = await sql2`SELECT k FROM __ezj_verify WHERE k = ${marker}`;
  check("data survives a fresh connection (durable)", found.length === 1, `rows=${found.length}`);
  await sql2`DELETE FROM __ezj_verify WHERE k = ${marker}`;
  await sql2.end({ timeout: 5 });

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
} catch (err) {
  console.error("verify harness error:", err);
  try { await sql.end({ timeout: 5 }); } catch {}
  process.exit(1);
}
