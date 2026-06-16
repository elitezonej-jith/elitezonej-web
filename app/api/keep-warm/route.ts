import { NextResponse } from "next/server";
import { sql } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

// Pinged every ~5 min to keep Neon's auto-suspending free-tier compute awake.
// Vercel Hobby caps crons at once-per-day, so this is meant to be hit from an
// external uptime monitor (UptimeRobot, cron-job.org, BetterStack) — point one
// at https://<your-domain>/api/keep-warm on a 5-min schedule. One SELECT 1 is
// enough to reset the idle timer. Returns 200 even on DB error so a transient
// blip doesn't fail the monitor and trigger alerts.
export async function GET(): Promise<NextResponse> {
  const t0 = Date.now();
  let ok = false;
  try {
    await sql.get("SELECT 1");
    ok = true;
  } catch (e) {
    console.warn("[keep-warm] db ping failed:", (e as Error).message);
  }
  return NextResponse.json({ ok, ms: Date.now() - t0 });
}
