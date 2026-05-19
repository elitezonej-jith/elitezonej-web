import "server-only";
import { sql } from "../db";

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await sql.all<{ key: string; value: string }>("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getSetting(key: string): Promise<string | null> {
  const r = await sql.get<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key]);
  return r?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await sql.run(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}

export async function setSettings(map: Record<string, string>): Promise<void> {
  await sql.tx(async (t) => {
    for (const [k, v] of Object.entries(map)) {
      await t.run(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [k, v],
      );
    }
  });
}
