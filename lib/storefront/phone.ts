/**
 * Normalise a phone number to a consistent digit-only format for matching.
 *
 * Examples:
 *   "+91 98765 43210"  → "919876543210"
 *   "09876543210"      → "919876543210"
 *   "9876543210"       → "919876543210"
 *   "+1 555 123 4567"  → "15551234567"
 *
 * Indian numbers (10 digits) are prefixed with "91" automatically.
 * Leading zero (trunk prefix) is stripped for 11-digit Indian numbers.
 * All other numbers are kept as-is after stripping non-digits.
 */
export function normalisePhone(raw: string): string {
  if (!raw) return "";
  // Strip everything except digits
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  // Indian mobile: exactly 10 digits starting with 6-9 → prefix with 91
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }

  // Indian with trunk prefix: 0 + 10 digits → strip 0, prefix 91
  if (digits.length === 11 && digits.startsWith("0") && /^0[6-9]/.test(digits)) {
    return `91${digits.slice(1)}`;
  }

  // Already has country code (91 + 10 digits = 12 digits) or international
  return digits;
}
