# Phone-Based First-Order Discount Validation — Architectural Plan

## Problem

The current first-order discount (`FIRST15`) only checks by **email**:
```sql
SELECT id, total_orders FROM customers WHERE LOWER(email) = ?
```

A customer can bypass this by creating multiple accounts with different emails but the same phone number. Since phone numbers are harder to fabricate (especially in India where SIMs require KYC), checking by phone provides significantly stronger protection.

---

## Current Flow (email-only)

```
Customer enters promo code FIRST15 at checkout
       │
       ▼
validatePromo() checks:
  1. promotions table: is code active? → yes
  2. first_order_only = 1 → triggers first-order logic
  3. SELECT FROM customers WHERE LOWER(email) = ? → checks total_orders
  4. SELECT FROM first_order_claims WHERE customer_id = ? AND status = 'pending'
  5. If all pass → discount applied
```

**Vulnerability:** Step 3 only matches by email. Different email = new customer = bypass.

---

## Proposed Flow (email + phone)

```
Customer enters promo code FIRST15 at checkout
       │
       ▼
validatePromo() checks:
  1. promotions table: is code active? → yes
  2. first_order_only = 1 → triggers first-order logic
  3. Check by EMAIL: SELECT FROM customers WHERE LOWER(email) = ? AND total_orders > 0
     → If match: reject "This code is valid for first orders only."
  4. Check by PHONE: SELECT FROM customers WHERE phone = ? AND total_orders > 0
     → If match: reject "This code is valid for first orders only."
  5. Check pending claims by EMAIL:
     SELECT FROM first_order_claims fc JOIN customers c ON c.id = fc.customer_id
     WHERE c.email = ? AND fc.status = 'pending'
  6. Check pending claims by PHONE:  ← NEW
     SELECT FROM first_order_claims fc JOIN customers c ON c.id = fc.customer_id
     WHERE c.phone = ? AND fc.status = 'pending'
  7. If all pass → discount applied
```

---

## Data Model Changes

**No schema changes needed.** The `customers` table already has a `phone` column, and `first_order_claims` references `customer_id` which links back to the phone. We just need to add phone-based lookups in the validation logic.

---

## File-Level Implementation Plan

### 1. Modify: `lib/storefront/checkout.ts` → `validatePromo()`

**Change the function signature** to accept phone alongside email:

```diff
 export async function validatePromo(
   code: string,
   lines: PricedLine[],
   subtotal: number,
   customerEmail?: string | null,
+  customerPhone?: string | null,
 ): Promise<PromoCheck> {
```

**Add phone-based checks** inside the `first_order_only` block:

```typescript
// Existing email check
if (customer && Number(customer.total_orders) > 0) {
  return { ok: false, error: "This code is valid for first orders only." };
}

// NEW: Phone-based check (catches multi-email abuse)
if (customerPhone) {
  const normalised = normalisePhone(customerPhone);
  const byPhone = await sql.get<{ id: number; total_orders: number }>(
    "SELECT id, total_orders FROM customers WHERE phone = ? AND total_orders > 0",
    [normalised],
  );
  if (byPhone) {
    return { ok: false, error: "This code is valid for first orders only." };
  }

  // Check pending claims by phone
  const pendingByPhone = await sql.get<{ id: number }>(
    `SELECT fc.id FROM first_order_claims fc
     JOIN customers c ON c.id = fc.customer_id
     WHERE c.phone = ? AND fc.status = 'pending'`,
    [normalised],
  );
  if (pendingByPhone) {
    return { ok: false, error: "You already have an order in progress with this discount." };
  }
}
```

### 2. Modify: `lib/storefront/checkout.ts` → `priceCart()`

**Pass phone through to `validatePromo()`:**

```diff
 export async function priceCart(
   lines: CartLineInput[],
   promoCode?: string | null,
   customerEmail?: string | null,
+  customerPhone?: string | null,
 ): Promise<PriceResult> {
   ...
-  const v = await validatePromo(promoCode.trim(), priced, subtotal, customerEmail ?? null);
+  const v = await validatePromo(promoCode.trim(), priced, subtotal, customerEmail ?? null, customerPhone ?? null);
```

### 3. Modify: `app/checkout/actions.ts` → `startCheckout()`

**Pass phone to `priceCart()`:**

```diff
- const priced = await priceCart(linesParsed.data, form.data.promo_code, form.data.email);
+ const priced = await priceCart(linesParsed.data, form.data.promo_code, form.data.email, form.data.phone);
```

### 4. Add: Phone normalisation utility

Create a helper to normalise phone numbers for consistent matching:

```typescript
// lib/storefront/phone.ts
export function normalisePhone(raw: string): string {
  // Strip all non-digits
  const digits = raw.replace(/\D/g, "");
  // Indian numbers: if 10 digits, prefix with 91
  if (digits.length === 10) return `91${digits}`;
  // If starts with 0, remove it and prefix 91
  if (digits.startsWith("0") && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
}
```

This ensures `+91 98765 43210`, `09876543210`, and `9876543210` all match to `919876543210`.

### 5. Modify: Customer phone storage

Ensure phones are normalised on save so the lookup works:
- In `createPendingOrder()`: normalise phone before inserting into customers table
- In walk-in order action: already uses raw phone (should normalise)

---

## Edge Cases & Decisions

| Scenario | Handling |
|---|---|
| Customer has no phone (field blank) | Skip phone check entirely — fall back to email-only (current behavior). Phone is required at checkout, so this only applies to legacy customers. |
| Same phone, different emails, first time | Both phone AND email checks pass → discount allowed. |
| Same phone, different email, second time | Phone check finds existing customer with `total_orders > 0` → rejected. |
| Same email, different phone | Email check catches it (current behavior). |
| Phone format variations (`+91`, `0`, spaces, dashes) | `normalisePhone()` strips all to digits → consistent matching. |
| Customer has phone but it's stored differently in DB | Normalise both the stored value and the incoming value. Requires a one-time migration of existing phone values OR normalise on read. |
| International customer (non-Indian number) | Works: `normalisePhone` returns the full digit string. Only the 10-digit special case assumes India. |
| Walk-in orders using FIRST15 | Walk-in orders already set `total_orders + 1` on the customer → subsequent attempts with same phone are caught. |
| Shared family phone (husband+wife ordering separately) | This is an acceptable false positive for a luxury brand. If it becomes an issue, support can override manually. |

---

## UX Impact

**Zero visible changes to the checkout UI.** The phone field already exists and is required. The check happens server-side during promo validation. The customer sees the same error message regardless of whether the block was triggered by email or phone: *"This code is valid for first orders only."*

---

## Implementation Order

| Step | File | Effort |
|---|---|---|
| 1 | Create `lib/storefront/phone.ts` — normalisation utility | 15min |
| 2 | Modify `validatePromo()` — add phone param + phone-based checks | 30min |
| 3 | Modify `priceCart()` — pass phone through | 5min |
| 4 | Modify `app/checkout/actions.ts` — pass phone to priceCart | 5min |
| 5 | Normalise phone on customer save (upsertCustomer) | 20min |
| 6 | Test: same phone, different email → should be rejected | 15min |

**Total: ~1.5 hours**

---

## What This Blocks

After implementation, the following attack is prevented:

```
❌ email1@gmail.com + phone 9876543210 → uses FIRST15 → 15% off ✓
❌ email2@gmail.com + phone 9876543210 → tries FIRST15 → REJECTED
❌ email3@gmail.com + phone 9876543210 → tries FIRST15 → REJECTED
```

The only way to bypass is to use a **different phone number** — which requires a different SIM (with India's KYC requirements, this is significantly harder than creating a new email).

---

## What This Does NOT Block (acceptable residual risk)

- Customer with genuinely multiple phone numbers (rare for the target demographic)
- Family members sharing a phone for separate accounts (edge case, support can override)
- Determined attacker buying burner SIMs (not economical for a 15% discount on ₹12,000+ orders)

For a premium tailoring brand, this level of protection is more than sufficient.
