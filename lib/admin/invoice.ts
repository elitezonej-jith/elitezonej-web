import "server-only";
import { sql } from "./db";

// ── Business settings for Tax Invoice header ────────────────────────────────

export type BusinessInfo = {
  legal_name: string;
  gstin: string;
  state_code: string;
  address: string;
  phone: string;
  phone2: string;
  email: string;
};

export async function getBusinessInfo(): Promise<BusinessInfo> {
  const rows = await sql.all<{ key: string; value: string }>(
    `SELECT key, value FROM settings WHERE key IN (
      'business_legal_name', 'business_gstin', 'business_state_code',
      'business_address', 'business_phone', 'business_phone2', 'business_email'
    )`,
  );
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    legal_name: map.get("business_legal_name") || "ZONE J",
    gstin: map.get("business_gstin") || "",
    state_code: map.get("business_state_code") || "33",
    address: map.get("business_address") || "",
    phone: map.get("business_phone") || "",
    phone2: map.get("business_phone2") || "",
    email: map.get("business_email") || "",
  };
}

// ── GST split logic ─────────────────────────────────────────────────────────

export type GstSplit = {
  cgst: number;
  sgst: number;
  igst: number;
};

/**
 * Splits total GST into CGST/SGST (intra-state) or IGST (inter-state).
 * Seller state code from business settings, buyer state from order.ship_state.
 */
export function splitGst(totalGst: number, sellerStateCode: string, buyerState: string): GstSplit {
  // Normalize: compare state codes if buyer provides code, otherwise fuzzy-match
  const buyerCode = stateToCode(buyerState);
  const isIntraState = !buyerCode || !sellerStateCode || buyerCode === sellerStateCode;

  if (isIntraState) {
    const half = Math.round(totalGst / 2);
    return { cgst: half, sgst: totalGst - half, igst: 0 };
  }
  return { cgst: 0, sgst: 0, igst: totalGst };
}

// ── Invoice number formatting ───────────────────────────────────────────────

/**
 * Sequential invoice number derived from order. For walk-in orders we extract
 * a shorter display number. Falls back to the order ID itself.
 */
export function invoiceNumber(orderId: string): string {
  // Order IDs like "EZJ-A1B2C3D4" — use just the suffix
  return orderId;
}

/**
 * Format date as DD.MM.YYYY (Indian invoice standard)
 */
export function invoiceDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

// ── Per-item GST helpers ────────────────────────────────────────────────────

export function computeItemGst(unitPrice: number, qty: number, gstRate: number): number {
  return Math.round((unitPrice * qty * gstRate) / 100);
}

export function itemTotal(unitPrice: number, qty: number, gstAmount: number): number {
  return unitPrice * qty + gstAmount;
}

// ── Indian state code mapping ───────────────────────────────────────────────

const STATE_CODES: Record<string, string> = {
  "jammu and kashmir": "01", "himachal pradesh": "02", "punjab": "03",
  "chandigarh": "04", "uttarakhand": "05", "haryana": "06", "delhi": "07",
  "rajasthan": "08", "uttar pradesh": "09", "bihar": "10", "sikkim": "11",
  "arunachal pradesh": "12", "nagaland": "13", "manipur": "14", "mizoram": "15",
  "tripura": "16", "meghalaya": "17", "assam": "18", "west bengal": "19",
  "jharkhand": "20", "odisha": "21", "chhattisgarh": "22", "madhya pradesh": "23",
  "gujarat": "24", "dadra and nagar haveli": "26", "daman and diu": "25",
  "maharashtra": "27", "andhra pradesh": "37", "karnataka": "29", "goa": "30",
  "lakshadweep": "31", "kerala": "32", "tamil nadu": "33", "puducherry": "34",
  "andaman and nicobar": "35", "telangana": "36", "ladakh": "38",
};

/** Convert state name or code to the 2-digit state code */
export function stateToCode(state: string): string {
  if (!state) return "";
  const lower = state.trim().toLowerCase();
  // Already a 2-digit code?
  if (/^\d{2}$/.test(lower)) return lower;
  return STATE_CODES[lower] || "";
}
