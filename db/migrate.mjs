// Forward-only migration runner. Applies migrations/*.sql in lexical order,
// skipping any already recorded in schema_migrations. Zero extra tooling —
// run with: node db/migrate.mjs   (needs DATABASE_URL).
//
// Each migration file owns its own BEGIN/COMMIT and inserts its version into
// schema_migrations (see migrations/0001_baseline.sql).
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const sql = postgres(url, { max: 1, prepare: false });

async function applied(version) {
  try {
    const rows = await sql`SELECT 1 FROM schema_migrations WHERE version = ${version}`;
    return rows.length > 0;
  } catch {
    return false; // schema_migrations doesn't exist yet → nothing applied
  }
}

try {
  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    if (await applied(version)) {
      console.log(`= skip ${version} (already applied)`);
      continue;
    }
    console.log(`+ apply ${version}`);
    await sql.unsafe(readFileSync(join(dir, file), "utf8"));
  }
  console.log("migrations complete");
} catch (err) {
  console.error("migration failed:", err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
