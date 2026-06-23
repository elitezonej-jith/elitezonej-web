-- schema-v9: OTP codes for passwordless login. Idempotent.

CREATE TABLE IF NOT EXISTS otp_codes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL,
  code       TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email, used, expires_at);
