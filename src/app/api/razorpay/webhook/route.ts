import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { fulfilBooking } from "@/lib/tickets";

/**
 * Razorpay → Dashboard → Webhooks → URL: https://<domain>/api/razorpay/webhook
 * Events: payment.captured, order.paid, payment.failed
 * Guarantees tickets are issued even if the customer closes the browser mid-payment.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") || ""))
    return NextResponse.json({ error: "bad signature" }, { status: 400 });

  const evt = JSON.parse(raw);
  const payment = evt.payload?.payment?.entity;
  const orderId: string | undefined = payment?.order_id || evt.payload?.order?.entity?.id;
  if (!orderId) return NextResponse.json({ ok: true });

  const booking = await prisma.booking.findUnique({ where: { razorpayOrderId: orderId } });
  if (!booking) return NextResponse.json({ ok: true });

  if (evt.event === "payment.captured" || evt.event === "order.paid") {
    if (payment?.amount && payment.amount !== booking.amount) {
      console.error("[webhook] amount mismatch", orderId);
      return NextResponse.json({ ok: false }, { status: 200 });
    }
    await fulfilBooking(booking.id, payment?.id);
  } else if (evt.event === "payment.failed" && booking.status === "PENDING") {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "FAILED" } });
  }
  return NextResponse.json({ ok: true });
}
