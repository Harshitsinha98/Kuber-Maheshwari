import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** All bookings (or one status) as CSV, for Excel / Google Sheets. */
export async function GET(req: Request) {
  if (!(await requireRole(["ADMIN"]))) return new Response("Forbidden", { status: 403 });
  const status = new URL(req.url).searchParams.get("status");
  const rows = await prisma.booking.findMany({
    where: status ? { status: status as "PAID" } : {},
    include: { event: true, ticketType: true, tickets: { select: { checkedInAt: true } } },
    orderBy: { createdAt: "desc" },
  });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const ist = (d?: Date | null) => (d ? d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "");
  const out = [["Booked at (IST)", "Status", "Event", "Event date", "City", "Ticket type", "Qty", "Amount (₹)", "Name", "Mobile", "Email", "Checked in", "Payment id", "Booking id"]];
  for (const b of rows)
    out.push([
      ist(b.createdAt),
      b.status,
      b.event.title,
      ist(b.event.startsAt),
      b.event.city,
      b.ticketType.name,
      String(b.quantity),
      String(b.amount / 100),
      b.attendeeName,
      b.attendeePhone,
      b.attendeeEmail,
      `${b.tickets.filter((t) => t.checkedInAt).length}/${b.tickets.length}`,
      b.razorpayPaymentId || "",
      b.id,
    ]);
  const name = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response("\uFEFF" + out.map((r) => r.map(esc).join(",")).join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` },
  });
}
