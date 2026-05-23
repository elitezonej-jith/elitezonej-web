// Currency, date, etc. formatters used across the admin panel.

export function rupees(n: number): string {
  if (typeof n !== "number" || !isFinite(n)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function rupeesShort(n: number): string {
  if (n >= 10_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_00_000) return `₹${Math.round(n / 1000)}k`;
  return rupees(n);
}

// Timestamp inputs differ by driver: SQLite returns TEXT ("2026-05-22 10:38:00")
// while postgres.js returns a JS Date for timestamptz columns. Normalize both
// (plus epoch numbers) to a Date here so callers never touch raw string methods.
type DateInput = string | Date | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const s = String(value);
  const d = new Date(s.replace(" ", "T") + (s.endsWith("Z") || s.includes("T") ? "" : "Z"));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function dateShort(iso: DateInput): string {
  const d = toDate(iso);
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export function dateTime(iso: DateInput): string {
  const d = toDate(iso);
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(d);
}

export function deltaPct(now: number, prior: number): { delta: "up" | "down" | "flat"; label: string } {
  if (prior === 0 && now === 0) return { delta: "flat", label: "no prior" };
  if (prior === 0) return { delta: "up", label: "new" };
  const pct = ((now - prior) / prior) * 100;
  const r = Math.abs(pct) < 0.5 ? 0 : Math.round(pct * 10) / 10;
  if (r === 0) return { delta: "flat", label: "0%" };
  return { delta: pct >= 0 ? "up" : "down", label: `${pct >= 0 ? "+" : ""}${r}%` };
}

export function padFolio(n: number): string {
  return String(n).padStart(2, "0");
}
