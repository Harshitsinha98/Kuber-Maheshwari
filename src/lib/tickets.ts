import crypto from "node:crypto";
import QRCode from "qrcode";
import { prisma } from "./prisma";
import { sendTicketEmail } from "./email";

const secret = () => process.env.TICKET_SIGNING_SECRET || process.env.NEXTAUTH_SECRET || "dev";

export const newTicketCode = () => crypto.randomBytes(9).toString("base64url").toUpperCase().replace(/[-_]/g, "X");

const sign = (code: string) =>
  crypto.createHmac("sha256", secret()).update(code).digest("base64url").slice(0, 10);

/** QR payload: KM1.<code>.<sig> — the signature makes forged/guessed codes fail even offline. */
export const qrPayload = (code: string) => `KM1.${code}.${sign(code)}`;

export function parseQrPayload(raw: string): string | null {
  const s = raw.trim();
  // Accept a full ticket URL too (someone scanning the QR with a normal camera app opens the ticket page).
  const fromUrl = s.match(/\/t\/([A-Z0-9]+)(?:\?s=([\w-]+))?/i);
  if (fromUrl) return fromUrl[2] && safeEq(sign(fromUrl[1]), fromUrl[2]) ? fromUrl[1] : null;
  const [v, code, sig] = s.split(".");
  if (v !== "KM1" || !code || !sig) return null;
  return safeEq(sign(code), sig) ? code : null;
}

function safeEq(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export const ticketUrl = (code: string) =>
  `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/t/${code}?s=${sign(code)}`;

export const qrDataUrl = (code: string) =>
  QRCode.toDataURL(qrPayload(code), { margin: 1, width: 480, color: { dark: "#1a0f0a", light: "#ffffff" } });

export const qrPng = (code: string) =>
  QRCode.toBuffer(qrPayload(code), { margin: 2, width: 600, color: { dark: "#1a0f0a", light: "#ffffff" } });

/**
 * Marks a booking as paid and creates its tickets exactly once.
 * Safe to call from both the client-side verify route and the Razorpay webhook.
 */
export async function fulfilBooking(bookingId: string, paymentId?: string) {
  const booking = await prisma.$transaction(async (tx) => {
    const claimed = await tx.booking.updateMany({
      where: { id: bookingId, status: { in: ["PENDING", "FAILED"] } },
      data: { status: "PAID", razorpayPaymentId: paymentId },
    });
    const b = await tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
    if (claimed.count === 1) {
      await tx.ticket.createMany({
        data: Array.from({ length: b.quantity }, (_, i) => ({
          code: newTicketCode(),
          bookingId: b.id,
          ticketTypeId: b.ticketTypeId,
          seatLabel: `${i + 1} / ${b.quantity}`,
        })),
      });
    }
    return b;
  });

  // Email is sent at most once (emailSentAt claim), outside the DB transaction.
  const claim = await prisma.booking.updateMany({
    where: { id: booking.id, status: "PAID", emailSentAt: null },
    data: { emailSentAt: new Date() },
  });
  if (claim.count === 1) {
    await sendTicketEmail(booking.id).catch(async (e) => {
      console.error("[email] ticket email failed", e);
      await prisma.booking.update({ where: { id: booking.id }, data: { emailSentAt: null } });
    });
  }
  return booking;
}

/** Seats still available for a ticket type (paid + recent pending holds count as taken). */
export async function remainingSeats(ticketTypeId: string) {
  const tt = await prisma.ticketType.findUniqueOrThrow({ where: { id: ticketTypeId } });
  const holdSince = new Date(Date.now() - 15 * 60 * 1000);
  const agg = await prisma.booking.aggregate({
    _sum: { quantity: true },
    where: {
      ticketTypeId,
      OR: [{ status: "PAID" }, { status: "PENDING", createdAt: { gte: holdSince } }],
    },
  });
  return Math.max(0, tt.capacity - (agg._sum.quantity || 0));
}

export type VerifyResult =
  | { ok: true; status: "ADMITTED"; ticket: TicketInfo }
  | { ok: false; status: "ALREADY_USED"; ticket: TicketInfo; at: Date }
  | { ok: false; status: "INVALID" | "NOT_PAID" | "WRONG_EVENT"; ticket?: TicketInfo };

type TicketInfo = { code: string; name: string; type: string; seat: string | null; event: string };

/** Atomic check-in: two gates scanning the same QR at once can never both admit it. */
export async function checkIn(raw: string, staffEmail: string, eventId?: string): Promise<VerifyResult> {
  const code = parseQrPayload(raw) ?? (/^[A-Z0-9]{12}$/.test(raw.trim().toUpperCase()) ? raw.trim().toUpperCase() : null);
  if (!code) return { ok: false, status: "INVALID" };

  const t = await prisma.ticket.findUnique({
    where: { code },
    include: { booking: { include: { event: true } }, ticketType: true },
  });
  if (!t) return { ok: false, status: "INVALID" };
  const info: TicketInfo = {
    code: t.code,
    name: t.booking.attendeeName,
    type: t.ticketType.name,
    seat: t.seatLabel,
    event: t.booking.event.title,
  };
  if (t.booking.status !== "PAID") return { ok: false, status: "NOT_PAID", ticket: info };
  if (eventId && t.booking.eventId !== eventId) return { ok: false, status: "WRONG_EVENT", ticket: info };

  const res = await prisma.ticket.updateMany({
    where: { id: t.id, checkedInAt: null },
    data: { checkedInAt: new Date(), checkedInBy: staffEmail },
  });
  if (res.count === 1) return { ok: true, status: "ADMITTED", ticket: info };
  const fresh = await prisma.ticket.findUniqueOrThrow({ where: { id: t.id } });
  return { ok: false, status: "ALREADY_USED", ticket: info, at: fresh.checkedInAt! };
}
