import { NextResponse } from "next/server";
import { emailConfig, sendTomorrowReminders } from "@/lib/email";

/** Daily at 10:00 IST (vercel.json): reminder emails for tomorrow's events. */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!emailConfig().enabled) return NextResponse.json({ skipped: "RESEND_API_KEY not set" });
  return NextResponse.json(await sendTomorrowReminders());
}
