import { verifyPassSig } from "@/lib/tickets";
import { bookingIcs } from "@/lib/wallet";

type Ctx = { params: Promise<{ id: string }> };

/** .ics calendar file for a booking (works with iPhone, Google, Outlook calendars). */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!verifyPassSig(id, new URL(req.url).searchParams.get("s"))) return new Response("Not found", { status: 404 });
  const ics = await bookingIcs(id);
  if (!ics) return new Response("Not found", { status: 404 });
  return new Response(ics.body, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${ics.filename}"`, "Cache-Control": "no-store" },
  });
}
