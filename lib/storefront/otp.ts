import "server-only";
import { randomInt } from "node:crypto";
import { sql } from "../admin/db";
import { sendOtpEmail } from "../email/send";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS_PER_HOUR = 5;

/** Generate a 6-digit numeric code */
function generateCode(): string {
  return String(randomInt(100000, 999999));
}

/**
 * Rate-limit check: no more than 5 OTPs per email per hour.
 */
async function isRateLimited(email: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const row = await sql.get<{ n: number | string }>(
    "SELECT COUNT(*) as n FROM otp_codes WHERE email = ? AND created_at > ?",
    [email, oneHourAgo],
  );
  return Number(row?.n ?? 0) >= MAX_ATTEMPTS_PER_HOUR;
}

/**
 * Create and send an OTP to the given email.
 * Returns { ok: true } or { ok: false, error: string }.
 */
export async function createAndSendOtp(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.toLowerCase().trim();

  if (await isRateLimited(normalized)) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }

  // Invalidate any previous unused codes for this email
  await sql.run(
    "UPDATE otp_codes SET used = 1 WHERE email = ? AND used = 0",
    [normalized],
  );

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  await sql.run(
    "INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)",
    [normalized, code, expiresAt],
  );

  try {
    await sendOtpEmail(normalized, code);
  } catch (e) {
    console.error("[otp] email send failed:", (e as Error).message);
    return { ok: false, error: "Failed to send email. Please try again." };
  }

  return { ok: true };
}

/**
 * Verify the OTP code for the given email.
 * Marks the code as used on success.
 */
export async function verifyOtp(
  email: string,
  code: string,
): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const now = new Date().toISOString();

  const row = await sql.get<{ id: number | string }>(
    `SELECT id FROM otp_codes
     WHERE email = ? AND code = ? AND used = 0 AND expires_at > ?
     ORDER BY created_at DESC LIMIT 1`,
    [normalized, code, now],
  );

  if (!row) return false;

  await sql.run("UPDATE otp_codes SET used = 1 WHERE id = ?", [row.id]);
  return true;
}
