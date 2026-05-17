// Post-migration seed. Production has no data (greenfield cutover), so this
// creates the minimum needed to operate: a default owner user and store
// settings. Idempotent (ON CONFLICT DO NOTHING). Run after migrate:
//   node db/seed.mjs   (needs DATABASE_URL; owner creds via env)
//
// NOTE: the product catalog is largely code-resident (lib/products). If you
// want it mirrored into Postgres for admin editing, extend this with the
// same source the SQLite path seeds from — intentionally NOT duplicated here.
import postgres from "postgres";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const ownerEmail = (process.env.SEED_OWNER_EMAIL ?? "admin@elitezonej.com").toLowerCase();
const ownerPass = process.env.SEED_OWNER_PASSWORD ?? "admin123";
const ownerName = process.env.SEED_OWNER_NAME ?? "Owner";

const sql = postgres(url, { max: 1, prepare: false });

try {
  const hash = await bcrypt.hash(ownerPass, 12);
  await sql`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (${ownerEmail}, ${hash}, ${ownerName}, 'owner')
    ON CONFLICT (email) DO NOTHING
  `;

  const settings = [
    ["brand_name", "Elite Zone J"],
    ["currency", "INR"],
    ["currency_symbol", "₹"],
    ["lead_time_days", "14"],
    ["low_stock_threshold", "3"],
  ];
  for (const [key, value] of settings) {
    await sql`
      INSERT INTO settings (key, value) VALUES (${key}, ${value})
      ON CONFLICT (key) DO NOTHING
    `;
  }

  console.log(`seed complete (owner: ${ownerEmail})`);
  if (ownerPass === "admin123") {
    console.warn("WARNING: default owner password in use — set SEED_OWNER_PASSWORD.");
  }
} catch (err) {
  console.error("seed failed:", err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
