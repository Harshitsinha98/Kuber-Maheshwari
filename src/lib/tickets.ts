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

// ---------- Group pass: one QR for a whole booking ----------
// Same one-entry-per-ticket rule: the pass just lets the gate admit several of the booking's tickets at once.

const signPass = (bookingId: string) => crypto.createHmac("sha256", secret()).update(`pass:${bookingId}`).digest("base64url").slice(0, 12);

export const passSig = signPass;
export const passPayload = (bookingId: string) => `KM2.${bookingId}.${signPass(bookingId)}`;
export const passUrl = (bookingId: string) =>
  `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/p/${bookingId}?s=${signPass(bookingId)}`;
export const verifyPassSig = (bookingId: string, sig?: string | null) => Boolean(sig) && safeEq(signPass(bookingId), String(sig));

export const passQrDataUrl = (bookingId: string) =>
  QRCode.toDataURL(passPayload(bookingId), { margin: 1, width: 560, color: { dark: "#1a0f0a", light: "#ffffff" } });
export const passQrPng = (bookingId: string) =>
  QRCode.toBuffer(passPayload(bookingId), { margin: 2, width: 640, color: { dark: "#1a0f0a", light: "#ffffff" } });

type Scan = { kind: "ticket"; code: string } | { kind: "pass"; bookingId: string };

/** Understands single-ticket QRs (KM1), group passes (KM2), their web links, and typed ticket codes. */
export function parseScan(raw: string): Scan | null {
  const s = raw.trim();
  const fromPassUrl = s.match(/\/p\/([a-z0-9]+)\?s=([\w-]+)/i);
  if (fromPassUrl) return verifyPassSig(fromPassUrl[1], fromPassUrl[2]) ? { kind: "pass", bookingId: fromPassUrl[1] } : null;
  if (s.startsWith("KM2.")) {
    const [, id, sig] = s.split(".");
    return id && verifyPassSig(id, sig) ? { kind: "pass", bookingId: id } : null;
  }
  const code = parseQrPayload(s) ?? (/^[A-Z0-9]{12}$/.test(s.toUpperCase()) ? s.toUpperCase() : null);
  return code ? { kind: "ticket", code } : null;
}

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
    // If email isn't set up yet or fails, emailSentAt goes back to null so the booking
    // shows up under Admin → Email → "Tickets not emailed" and can be re-sent later.
    const ok = await sendTicketEmail(booking.id)
      .then((r) => r.ok)
      .catch((e) => {
        console.error("[email] ticket email failed", e);
        return false;
      });
    if (!ok) await prisma.booking.update({ where: { id: booking.id }, data: { emailSentAt: null } });
    // WhatsApp alerts ride on the same "first time this booking became paid" claim, so they're sent once.
    const { whatsappBookingAlerts } = await import("./whatsapp");
    await whatsappBookingAlerts(booking.id).catch((e) => console.error("[whatsapp] booking alert failed", e));
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

type Counts = { total: number; entered: number; remaining: number };

export type VerifyResult =
  | ({ ok: true; status: "ADMITTED"; ticket: TicketInfo; admitted: number } & Partial<Counts>)
  | ({ ok: true; status: "GROUP"; ticket: TicketInfo } & Counts)
  | ({ ok: false; status: "ALREADY_USED"; ticket: TicketInfo; at: Date } & Partial<Counts>)
  | { ok: false; status: "INVALID" | "NOT_PAID" | "WRONG_EVENT"; ticket?: TicketInfo };

type TicketInfo = { code: string; name: string; type: string; seat: string | null; event: string };

/**
 * Gate check-in. Atomic in every case: two gates scanning the same QR at the same moment
 * can never let in more people than there are tickets.
 *  - single ticket QR → admits that ticket once
 *  - group pass QR → first scan returns GROUP (how many are left); calling again with
 *    `admit: n` lets n of the remaining tickets in. A 1-ticket pass is admitted straight away.
 */
export async function checkIn(raw: string, staffEmail: string, eventId?: string, admit?: number): Promise<VerifyResult> {
  const scan = parseScan(raw);
  if (!scan) return { ok: false, status: "INVALID" };
  if (scan.kind === "pass") return checkInPass(scan.bookingId, staffEmail, eventId, admit);
  const code = scan.code;

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
  if (res.count === 1) return { ok: true, status: "ADMITTED", ticket: info, admitted: 1 };
  const fresh = await prisma.ticket.findUniqueOrThrow({ where: { id: t.id } });
  return { ok: false, status: "ALREADY_USED", ticket: info, at: fresh.checkedInAt! };
}

async function checkInPass(bookingId: string, staffEmail: string, eventId?: string, admit?: number): Promise<VerifyResult> {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { event: true, ticketType: true, tickets: { select: { checkedInAt: true } } },
  });
  if (!b) return { ok: false, status: "INVALID" };
  const total = b.tickets.length;
  const counts = (entered: number): Counts => ({ total, entered, remaining: total - entered });
  const info: TicketInfo = { code: `Group pass · ${total}`, name: b.attendeeName, type: b.ticketType.name, seat: `${total} ticket${total > 1 ? "s" : ""}`, event: b.event.title };
  if (b.status !== "PAID" || total === 0) return { ok: false, status: "NOT_PAID", ticket: info };
  if (eventId && b.eventId !== eventId) return { ok: false, status: "WRONG_EVENT", ticket: info };

  const entered = b.tickets.filter((t) => t.checkedInAt).length;
  const lastEntry = () =>
    prisma.ticket.findFirst({ where: { bookingId, checkedInAt: { not: null } }, orderBy: { checkedInAt: "desc" } }).then((t) => t?.checkedInAt ?? new Date());
  if (entered >= total) return { ok: false, status: "ALREADY_USED", ticket: info, at: await lastEntry(), ...counts(total) };

  const want = admit ?? (total === 1 ? 1 : 0);
  if (!want) return { ok: true, status: "GROUP", ticket: info, ...counts(entered) };

  // Claim up to `want` unused tickets of this booking in one statement. SKIP LOCKED means a
  // second gate scanning at the same instant only gets whatever is genuinely still unused.
  const n = Math.max(1, Math.min(want, total));
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    UPDATE "Ticket" SET "checkedInAt" = ${new Date()}, "checkedInBy" = ${staffEmail}
    WHERE "id" IN (
      SELECT "id" FROM "Ticket"
      WHERE "bookingId" = ${bookingId} AND "checkedInAt" IS NULL
      ORDER BY "createdAt", "id"
      LIMIT ${n}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING "id"`;
  const nowEntered = await prisma.ticket.count({ where: { bookingId, checkedInAt: { not: null } } });
  if (rows.length === 0) return { ok: false, status: "ALREADY_USED", ticket: info, at: await lastEntry(), ...counts(nowEntered) };
  return { ok: true, status: "ADMITTED", ticket: info, admitted: rows.length, ...counts(nowEntered) };
}
