import { NextResponse } from "next/server";
import { sql } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

// Vercel Cron pings this every few minutes (see vercel.json) to keep Neon's
// auto-suspending compute awake on the free tier. One SELECT 1 is enough to
// reset the idle timer. Returns 200 even on DB error so a transient blip
// doesn't fail the cron and trigger Vercel alerts.
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
