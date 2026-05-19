import "server-only";
import { sql, type SqlClient } from "../db";

export type Address = {
  id: number;
  customer_id: number;
  label: string;
  first_name: string;
  last_name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: number;
  created_at: string;
  updated_at: string;
};

/** The user-editable address fields (everything except identity/ownership). */
export type AddressInput = {
  label: string;
  first_name: string;
  last_name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

/** All addresses for one customer, default first then newest. customerId is
 *  always the server-resolved session id — never client-supplied. */
export async function listAddressesForCustomer(customerId: number): Promise<Address[]> {
  return sql.all<Address>(
    `SELECT * FROM addresses WHERE customer_id = ?
     ORDER BY is_default DESC, created_at DESC`,
    [customerId],
  );
}

/** A single address, scoped to its owner. Returns null if it does not exist
 *  OR is owned by someone else — the two cases are indistinguishable by
 *  design, which defeats id enumeration / IDOR. */
export async function getAddress(id: number, customerId: number): Promise<Address | null> {
  return sql.get<Address>(
    "SELECT * FROM addresses WHERE id = ? AND customer_id = ?",
    [id, customerId],
  );
}

async function clearDefaults(
  t: SqlClient,
  customerId: number,
): Promise<void> {
  await t.run(
    "UPDATE addresses SET is_default = 0, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?",
    [customerId],
  );
}

/** Insert a new address. If makeDefault (or it's the customer's first
 *  address) it becomes the sole default. Returns the new id. */
export async function createAddress(
  customerId: number,
  input: AddressInput,
  makeDefault: boolean,
): Promise<number> {
  return sql.tx(async (t) => {
    const countRow = await t.get<{ n: number | string }>(
      "SELECT COUNT(*) AS n FROM addresses WHERE customer_id = ?",
      [customerId],
    );
    const count = Number(countRow?.n ?? 0);
    const isDefault = makeDefault || count === 0;
    if (isDefault) await clearDefaults(t, customerId);
    const r = await t.run(
      `INSERT INTO addresses
         (customer_id, label, first_name, last_name, line1, line2, city, state, pincode, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        customerId,
        input.label,
        input.first_name,
        input.last_name,
        input.line1,
        input.line2,
        input.city,
        input.state,
        input.pincode,
        input.country,
        isDefault ? 1 : 0,
      ],
    );
    return Number(r.rows[0].id);
  });
}

/** Update an address the caller owns. Returns false if the id is not owned
 *  by customerId (no row changed) — caller surfaces a generic "not found". */
export async function updateAddress(
  id: number,
  customerId: number,
  input: AddressInput,
): Promise<boolean> {
  const r = await sql.run(
    `UPDATE addresses SET
       label = ?, first_name = ?, last_name = ?, line1 = ?, line2 = ?,
       city = ?, state = ?, pincode = ?, country = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND customer_id = ?`,
    [
      input.label,
      input.first_name,
      input.last_name,
      input.line1,
      input.line2,
      input.city,
      input.state,
      input.pincode,
      input.country,
      id,
      customerId,
    ],
  );
  return r.count > 0;
}

/** Delete an owned address. If it was the default and others remain, the
 *  most-recently-created remaining one is promoted to default. */
export async function deleteAddress(id: number, customerId: number): Promise<boolean> {
  return sql.tx(async (t) => {
    const row = await t.get<{ is_default: number }>(
      "SELECT is_default FROM addresses WHERE id = ? AND customer_id = ?",
      [id, customerId],
    );
    if (!row) return false;
    await t.run("DELETE FROM addresses WHERE id = ? AND customer_id = ?", [
      id,
      customerId,
    ]);
    if (row.is_default) {
      await t.run(
        `UPDATE addresses SET is_default = 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = (
           SELECT id FROM addresses WHERE customer_id = ?
           ORDER BY created_at DESC LIMIT 1
         )`,
        [customerId],
      );
    }
    return true;
  });
}

/** Make an owned address the sole default. Returns false if not owned. */
export async function setDefaultAddress(id: number, customerId: number): Promise<boolean> {
  return sql.tx(async (t) => {
    await clearDefaults(t, customerId);
    const r = await t.run(
      "UPDATE addresses SET is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND customer_id = ?",
      [id, customerId],
    );
    return r.count > 0;
  });
}

/** Persist the address used on a completed order, de-duplicated. Two
 *  addresses are "the same" when line1/line2/city/state collapse
 *  case/space-insensitively and pincode matches. No-op on a match. Becomes
 *  the default only if the customer had no addresses yet. Never throws to
 *  the caller-critical path — callers wrap in try/catch. */
export async function saveAddressFromOrder(
  customerId: number,
  addr: Omit<AddressInput, "label">,
): Promise<void> {
  const dup = await sql.get<{ id: number }>(
    `SELECT id FROM addresses
     WHERE customer_id = ?
       AND TRIM(LOWER(line1)) = TRIM(LOWER(?))
       AND TRIM(LOWER(line2)) = TRIM(LOWER(?))
       AND TRIM(LOWER(city))  = TRIM(LOWER(?))
       AND TRIM(LOWER(state)) = TRIM(LOWER(?))
       AND TRIM(pincode)      = TRIM(?)`,
    [
      customerId,
      addr.line1,
      addr.line2,
      addr.city,
      addr.state,
      addr.pincode,
    ],
  );
  if (dup) return;
  await createAddress(customerId, { label: "", ...addr }, /* makeDefault */ false);
}
