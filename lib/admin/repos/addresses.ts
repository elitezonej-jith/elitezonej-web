import "server-only";
import { getDb } from "../db";

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
export function listAddressesForCustomer(customerId: number): Address[] {
  return getDb()
    .prepare(
      `SELECT * FROM addresses WHERE customer_id = ?
       ORDER BY is_default DESC, datetime(created_at) DESC`,
    )
    .all(customerId) as Address[];
}

/** A single address, scoped to its owner. Returns null if it does not exist
 *  OR is owned by someone else — the two cases are indistinguishable by
 *  design, which defeats id enumeration / IDOR. */
export function getAddress(id: number, customerId: number): Address | null {
  return (
    (getDb()
      .prepare("SELECT * FROM addresses WHERE id = ? AND customer_id = ?")
      .get(id, customerId) as Address | undefined) ?? null
  );
}

function clearDefaults(
  db: ReturnType<typeof getDb>,
  customerId: number,
): void {
  db.prepare(
    "UPDATE addresses SET is_default = 0, updated_at = datetime('now') WHERE customer_id = ?",
  ).run(customerId);
}

/** Insert a new address. If makeDefault (or it's the customer's first
 *  address) it becomes the sole default. Returns the new id. */
export function createAddress(
  customerId: number,
  input: AddressInput,
  makeDefault: boolean,
): number {
  const db = getDb();
  const tx = db.transaction(() => {
    const count = (
      db
        .prepare("SELECT COUNT(*) AS n FROM addresses WHERE customer_id = ?")
        .get(customerId) as { n: number }
    ).n;
    const isDefault = makeDefault || count === 0;
    if (isDefault) clearDefaults(db, customerId);
    const r = db
      .prepare(
        `INSERT INTO addresses
           (customer_id, label, first_name, last_name, line1, line2, city, state, pincode, country, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
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
      );
    return Number(r.lastInsertRowid);
  });
  return tx();
}

/** Update an address the caller owns. Returns false if the id is not owned
 *  by customerId (no row changed) — caller surfaces a generic "not found". */
export function updateAddress(
  id: number,
  customerId: number,
  input: AddressInput,
): boolean {
  const r = getDb()
    .prepare(
      `UPDATE addresses SET
         label = ?, first_name = ?, last_name = ?, line1 = ?, line2 = ?,
         city = ?, state = ?, pincode = ?, country = ?, updated_at = datetime('now')
       WHERE id = ? AND customer_id = ?`,
    )
    .run(
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
    );
  return r.changes > 0;
}

/** Delete an owned address. If it was the default and others remain, the
 *  most-recently-created remaining one is promoted to default. */
export function deleteAddress(id: number, customerId: number): boolean {
  const db = getDb();
  const tx = db.transaction(() => {
    const row = db
      .prepare("SELECT is_default FROM addresses WHERE id = ? AND customer_id = ?")
      .get(id, customerId) as { is_default: number } | undefined;
    if (!row) return false;
    db.prepare("DELETE FROM addresses WHERE id = ? AND customer_id = ?").run(
      id,
      customerId,
    );
    if (row.is_default) {
      db.prepare(
        `UPDATE addresses SET is_default = 1, updated_at = datetime('now')
         WHERE id = (
           SELECT id FROM addresses WHERE customer_id = ?
           ORDER BY datetime(created_at) DESC LIMIT 1
         )`,
      ).run(customerId);
    }
    return true;
  });
  return tx();
}

/** Make an owned address the sole default. Returns false if not owned. */
export function setDefaultAddress(id: number, customerId: number): boolean {
  const db = getDb();
  const tx = db.transaction(() => {
    clearDefaults(db, customerId);
    const r = db
      .prepare(
        "UPDATE addresses SET is_default = 1, updated_at = datetime('now') WHERE id = ? AND customer_id = ?",
      )
      .run(id, customerId);
    return r.changes > 0;
  });
  return tx();
}

/** Persist the address used on a completed order, de-duplicated. Two
 *  addresses are "the same" when line1/line2/city/state collapse
 *  case/space-insensitively and pincode matches. No-op on a match. Becomes
 *  the default only if the customer had no addresses yet. Never throws to
 *  the caller-critical path — callers wrap in try/catch. */
export function saveAddressFromOrder(
  customerId: number,
  addr: Omit<AddressInput, "label">,
): void {
  const db = getDb();
  const dup = db
    .prepare(
      `SELECT id FROM addresses
       WHERE customer_id = ?
         AND TRIM(LOWER(line1)) = TRIM(LOWER(?))
         AND TRIM(LOWER(line2)) = TRIM(LOWER(?))
         AND TRIM(LOWER(city))  = TRIM(LOWER(?))
         AND TRIM(LOWER(state)) = TRIM(LOWER(?))
         AND TRIM(pincode)      = TRIM(?)`,
    )
    .get(
      customerId,
      addr.line1,
      addr.line2,
      addr.city,
      addr.state,
      addr.pincode,
    ) as { id: number } | undefined;
  if (dup) return;
  createAddress(customerId, { label: "", ...addr }, /* makeDefault */ false);
}
