import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpayEnabled, verifyPaymentSignature } from "@/lib/razorpay";
import { confirmShowPayment } from "@/lib/show-booking";

const Body = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

/** Called by the browser right after the advance is paid. The Razorpay webhook is the backup path. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = p.data;
  if (!razorpayEnabled()) return NextResponse.json({ error: "Online payment is not set up" }, { status: 400 });
  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
    return NextResponse.json({ error: "Payment signature mismatch" }, { status: 400 });

  const b = await prisma.showBooking.findUnique({ where: { razorpayOrderId: razorpay_order_id }, select: { id: true, userId: true } });
  if (!b || b.userId !== session.user.id) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const done = await confirmShowPayment(b.id, razorpay_payment_id);
  return NextResponse.json({ bookingId: b.id, status: done?.status });
}
