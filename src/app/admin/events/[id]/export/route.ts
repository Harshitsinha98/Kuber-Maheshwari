import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireRole(["ADMIN"]))) return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const e = await prisma.event.findUnique({
    where: { id },
    include: { bookings: { where: { status: "PAID" }, include: { tickets: true, ticketType: true } } },
  });
  if (!e) return new Response("Not found", { status: 404 });

  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["Ticket code", "Seat", "Type", "Name", "Phone", "Email", "Amount (₹)", "Payment id", "Booked at", "Checked in at"]];
  for (const b of e.bookings)
    for (const t of b.tickets)
      rows.push([t.code, t.seatLabel || "", b.ticketType.name, b.attendeeName, b.attendeePhone, b.attendeeEmail, String(b.amount / 100 / b.quantity), b.razorpayPaymentId || "", b.createdAt.toISOString(), t.checkedInAt?.toISOString() || ""]);

  return new Response("\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${e.slug}-attendees.csv"` },
  });
}
