import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpay, razorpayEnabled } from "@/lib/razorpay";
import { fulfilBooking } from "@/lib/tickets";

const Body = z.object({
  eventId: z.string().min(1),
  ticketTypeId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .transform((s) => s.replace(/\D/g, "").slice(-10))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number")),
});

const HOLD_MINUTES = 15;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || !session.user.email) return NextResponse.json({ error: "Please sign in first" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  const { eventId, ticketTypeId, quantity, name, phone } = parsed.data;

  const tt = await prisma.ticketType.findFirst({ where: { id: ticketTypeId, eventId }, include: { event: true } });
  if (!tt || tt.event.status !== "PUBLISHED") return NextResponse.json({ error: "Event not available" }, { status: 404 });
  if (tt.event.startsAt.getTime() < Date.now() - 6 * 3600e3) return NextResponse.json({ error: "This event has ended" }, { status: 400 });
  if (quantity > tt.maxPerOrder) return NextResponse.json({ error: `Maximum ${tt.maxPerOrder} tickets per booking` }, { status: 400 });
  if (tt.price > 0 && !razorpayEnabled()) return NextResponse.json({ error: "Online payments are not enabled yet" }, { status: 503 });

  // Capacity check + seat hold, serialised per ticket type with a transaction-scoped advisory lock.
  let booking;
  try {
    booking = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ticketTypeId}))`;
      const holdSince = new Date(Date.now() - HOLD_MINUTES * 60 * 1000);
      const agg = await tx.booking.aggregate({
        _sum: { quantity: true },
        where: { ticketTypeId, OR: [{ status: "PAID" }, { status: "PENDING", createdAt: { gte: holdSince } }] },
      });
      const left = tt.capacity - (agg._sum.quantity || 0);
      if (left < quantity) throw new Error(left > 0 ? `Only ${left} tickets left` : "Sold out");
      return tx.booking.create({
        data: {
          userId: session.user.id,
          eventId,
          ticketTypeId,
          quantity,
          amount: tt.price * quantity,
          attendeeName: name,
          attendeePhone: phone,
          attendeeEmail: session.user.email!,
        },
      });
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { phone } }).catch(() => {});

  if (booking.amount === 0) {
    await fulfilBooking(booking.id);
    return NextResponse.json({ free: true, bookingId: booking.id });
  }

  try {
    const order = await razorpay().orders.create({
      amount: booking.amount,
      currency: "INR",
      receipt: booking.id,
      notes: { bookingId: booking.id, event: tt.event.title },
    });
    await prisma.booking.update({ where: { id: booking.id }, data: { razorpayOrderId: order.id } });
    return NextResponse.json({ orderId: order.id, amount: booking.amount, key: process.env.RAZORPAY_KEY_ID, bookingId: booking.id });
  } catch (e) {
    console.error("[razorpay] order create failed", e);
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 });
  }
}
