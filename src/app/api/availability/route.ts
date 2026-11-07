import { NextResponse } from "next/server";
import { addDays, isDayKey } from "@/lib/format";
import { getAvailability } from "@/lib/show-booking";

export const dynamic = "force-dynamic";

/** Public: which dates are booked / blocked. No customer details. ?from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const from = u.searchParams.get("from") || "";
  const to = u.searchParams.get("to") || "";
  if (!isDayKey(from) || !isDayKey(to) || to < from || to > addDays(from, 400))
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  try {
    return NextResponse.json({ days: await getAvailability(from, to) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[availability]", (e as Error).message);
    return NextResponse.json({ error: "Calendar is unavailable right now" }, { status: 503 });
  }
}
