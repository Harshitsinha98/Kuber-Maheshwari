import { randomBytes } from "node:crypto";
import type { Prisma, ShowBooking } from "@prisma/client";
import { prisma } from "./prisma";
import { ensureBookingTables } from "./booking-tables";
import { addDays, istDayKey, isDayKey } from "./format";
import { razorpay, razorpayEnabled } from "./razorpay";
import {
  checkAnswers,
  questionsFor,
  quote,
  type Answers,
  type BookingRules,
  type ChoiceOption,
  type PublicLocation,
  type PublicQuestion,
  type PublicService,
} from "./show-pricing";

/**
 * Show bookings: a customer books Kuber ji for one date.
 *
 * No double booking: CalendarDay has the date as its primary key, so the database itself
 * refuses a second row for the same date. On top of that every change to a date runs inside a
 * transaction holding a Postgres advisory lock for that date, so checks and writes can't interleave.
 * While a customer pays, the date is HELD for HOLD_MINUTES; an expired hold is free again.
 */

export const HOLD_MINUTES = 15;
const RULES_KEY = "booking_rules";
export const DEFAULT_RULES: BookingRules = { advancePercent: 25, minNoticeDays: 2, maxMonthsAhead: 12 };

type Tx = Prisma.TransactionClient;

export class BookingError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

// ---------- Setup (services, locations, questions, rules) ----------

export async function getRules(): Promise<BookingRules> {
  const row = await prisma.setting.findUnique({ where: { key: RULES_KEY } }).catch(() => null);
  try {
    const v = row ? (JSON.parse(row.value) as Partial<BookingRules>) : {};
    return { ...DEFAULT_RULES, ...v };
  } catch {
    return DEFAULT_RULES;
  }
}

export const saveRules = (r: BookingRules) =>
  prisma.setting.upsert({ where: { key: RULES_KEY }, update: { value: JSON.stringify(r) }, create: { key: RULES_KEY, value: JSON.stringify(r) } });

export const parseOptions = (v: Prisma.JsonValue): ChoiceOption[] =>
  Array.isArray(v)
    ? v
        .filter((o): o is { id: string; label: string; price: number } => !!o && typeof o === "object" && "id" in o && "label" in o)
        .map((o) => ({ id: String(o.id), label: String(o.label), price: Math.max(0, Math.round(Number(o.price) || 0)) }))
    : [];

type QuestionRow = Awaited<ReturnType<typeof prisma.bookingQuestion.findMany>>[number];
export const toPublicQuestion = (q: QuestionRow): PublicQuestion => ({
  id: q.id,
  label: q.label,
  labelHi: q.labelHi,
  help: q.help,
  kind: q.kind,
  required: q.required,
  options: parseOptions(q.options),
  unitPrice: q.unitPrice,
  freeUnits: q.freeUnits,
  minValue: q.minValue,
  maxValue: q.maxValue,
  serviceIds: q.serviceIds,
});

/** What the public booking wizard needs. Only active items are shown to customers. */
export async function getPublicSetup(): Promise<{
  services: PublicService[];
  locations: PublicLocation[];
  questions: PublicQuestion[];
  rules: BookingRules;
}> {
  await ensureBookingTables();
  const order = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];
  const [services, locations, questions, rules] = await Promise.all([
    prisma.bookingService.findMany({ where: { active: true }, orderBy: order }),
    prisma.bookingLocation.findMany({ where: { active: true }, orderBy: order }),
    prisma.bookingQuestion.findMany({ where: { active: true }, orderBy: order }),
    getRules(),
  ]);
  return {
    services: services.map(({ id, name, nameHi, description, basePrice }) => ({ id, name, nameHi, description, basePrice })),
    locations: locations.map(({ id, name, travelCost, note }) => ({ id, name, travelCost, note })),
    questions: questions.map(toPublicQuestion),
    rules,
  };
}

/** First and last date a customer may pick. */
export function bookingWindow(rules: BookingRules, today = istDayKey()) {
  const last = new Date(`${today}T00:00:00Z`);
  last.setUTCMonth(last.getUTCMonth() + rules.maxMonthsAhead);
  return { today, first: addDays(today, rules.minNoticeDays), last: last.toISOString().slice(0, 10) };
}

// ---------- Availability ----------

export type DayState = "booked" | "blocked";

const istStart = (key: string) => new Date(`${key}T00:00:00+05:30`);

/** Dates of Kuber ji's own published events (ticketed shows) between from and to (inclusive). */
async function eventDays(db: Tx | typeof prisma, from: string, to: string) {
  const events = await db.event.findMany({
    where: { status: "PUBLISHED", startsAt: { gte: istStart(from), lt: istStart(addDays(to, 1)) } },
    select: { startsAt: true, title: true, id: true },
  });
  return events.map((e) => ({ date: istDayKey(e.startsAt), title: e.title, id: e.id }));
}

const liveDay = { OR: [{ kind: { not: "HOLD" as const } }, { holdUntil: { gt: new Date() } }] };

/** Public view: only "booked" / "blocked" per date, no customer details. */
export async function getAvailability(from: string, to: string): Promise<Record<string, DayState>> {
  await ensureBookingTables();
  const [days, events] = await Promise.all([
    prisma.calendarDay.findMany({ where: { date: { gte: from, lte: to }, ...liveDay }, select: { date: true, kind: true } }),
    eventDays(prisma, from, to),
  ]);
  const out: Record<string, DayState> = {};
  for (const e of events) out[e.date] = "booked";
  for (const d of days) out[d.date] = d.kind === "BLOCKED" ? "blocked" : "booked";
  return out;
}

// ---------- Date locking ----------

const lockDay = (tx: Tx, date: string) => tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`km-day:${date}`}))`;

/** Why a date can't be taken by this booking, or null when it is free (or already ours). Call with the day locked. */
async function dayTakenReason(tx: Tx, date: string, bookingId?: string): Promise<string | null> {
  const day = await tx.calendarDay.findUnique({ where: { date } });
  if (day && !(bookingId && day.bookingId === bookingId)) {
    const expired = day.kind === "HOLD" && (!day.holdUntil || day.holdUntil < new Date());
    if (!expired) return day.kind === "BLOCKED" ? "This date is not available." : day.kind === "HOLD" ? "Someone is booking this date right now. Please pick another date or try again in a few minutes." : "This date is already booked.";
  }
  if (!(day && bookingId && day.bookingId === bookingId) && (await eventDays(tx, date, date)).length) return "Kuber ji already has a programme on this date.";
  return null;
}

/** Puts this booking on the date (HOLD or BOOKED). Call with the day locked, after dayTakenReason() returned null. */
async function putOnDay(tx: Tx, date: string, bookingId: string, kind: "HOLD" | "BOOKED") {
  await tx.calendarDay.deleteMany({ where: { OR: [{ bookingId }, { date }] } });
  await tx.calendarDay.create({
    data: { date, kind, bookingId, holdUntil: kind === "HOLD" ? new Date(Date.now() + HOLD_MINUTES * 60_000) : null },
  });
}

// ---------- Customer flow ----------

export type CreateInput = {
  date: string;
  serviceId: string;
  locationId: string;
  venue: string;
  answers: Answers;
  name: string;
  phone: string;
  email?: string;
  message?: string;
};

const newRef = (date: string) => `KM-${date.slice(5, 7)}${date.slice(8, 10)}-${randomBytes(3).toString("hex").toUpperCase().slice(0, 4)}`;

export async function createShowBooking(input: CreateInput) {
  await ensureBookingTables();
  if (!isDayKey(input.date)) throw new BookingError("Please choose a valid date.");
  const rules = await getRules();
  const w = bookingWindow(rules);
  if (input.date < w.first) throw new BookingError(rules.minNoticeDays ? `Online booking needs at least ${rules.minNoticeDays} days' notice. For an earlier date please call us.` : "Please choose a future date.");
  if (input.date > w.last) throw new BookingError("This date is too far ahead for online booking. Please call us.");

  const [service, location, qRows] = await Promise.all([
    prisma.bookingService.findUnique({ where: { id: input.serviceId } }),
    prisma.bookingLocation.findUnique({ where: { id: input.locationId } }),
    prisma.bookingQuestion.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);
  if (!service?.active) throw new BookingError("This programme is not available for online booking any more. Please refresh the page.");
  if (!location?.active) throw new BookingError("This location is not available any more. Please refresh the page.");

  const qs = questionsFor(qRows.map(toPublicQuestion), service.id);
  const answers: Answers = {};
  for (const q of qs) if (input.answers[q.id] != null) answers[q.id] = String(input.answers[q.id]).trim();
  const bad = checkAnswers(qs, answers);
  if (bad) throw new BookingError(bad);

  const q = quote(service, location, qs, answers, rules.advancePercent);
  const online = q.advance > 0 && razorpayEnabled();

  const booking = await prisma.$transaction(async (tx) => {
    await lockDay(tx, input.date);
    const why = await dayTakenReason(tx, input.date);
    if (why) throw new BookingError(why, 409);
    let b: ShowBooking | null = null;
    for (let i = 0; !b; i++) {
      try {
        b = await tx.showBooking.create({
          data: {
            ref: newRef(input.date),
            date: input.date,
            serviceId: service.id,
            serviceName: service.nameHi ? `${service.nameHi} (${service.name})` : service.name,
            locationId: location.id,
            locationName: location.name,
            venue: input.venue,
            name: input.name,
            phone: input.phone,
            email: input.email || null,
            message: input.message || null,
            answers: q.answers,
            basePrice: q.base,
            travelCost: q.travel,
            extrasPrice: q.extras,
            total: q.total,
            advancePercent: rules.advancePercent,
            advanceAmount: q.advance,
            status: online ? "PENDING" : "REQUESTED",
          },
        });
      } catch (e) {
        if ((e as { code?: string }).code !== "P2002" || i > 3) throw e; // ref collision: try another
      }
    }
    if (online) await putOnDay(tx, input.date, b.id, "HOLD");
    return b;
  });

  if (!online) {
    await notifyOnce(booking.id);
    return { booking, order: null };
  }

  try {
    const order = await razorpay().orders.create({
      amount: booking.advanceAmount,
      currency: "INR",
      receipt: booking.id,
      notes: { showBookingId: booking.id, date: booking.date, ref: booking.ref },
    });
    await prisma.showBooking.update({ where: { id: booking.id }, data: { razorpayOrderId: order.id } });
    return { booking, order: { id: order.id, amount: booking.advanceAmount, key: process.env.RAZORPAY_KEY_ID! } };
  } catch (e) {
    console.error("[show-booking] razorpay order", e);
    await markFailed(booking.id);
    throw new BookingError("Could not start the payment. Please try again.", 502);
  }
}

/** Advance received (browser verify or webhook). Idempotent. */
export async function confirmShowPayment(id: string, paymentId?: string) {
  await ensureBookingTables();
  const first = await prisma.showBooking.findUnique({ where: { id }, select: { date: true } });
  if (!first) return null;
  const b = await prisma.$transaction(async (tx) => {
    await lockDay(tx, first.date);
    const cur = await tx.showBooking.findUniqueOrThrow({ where: { id } });
    if (cur.status === "CONFIRMED" || cur.status === "CONFLICT") return cur;
    // The hold may have expired and the date gone to someone else: keep the money on record and flag it.
    const free = cur.status !== "CANCELLED" && !(await dayTakenReason(tx, cur.date, cur.id));
    if (free) await putOnDay(tx, cur.date, cur.id, "BOOKED");
    return tx.showBooking.update({
      where: { id },
      data: { status: free ? "CONFIRMED" : "CONFLICT", paidAmount: Math.max(cur.paidAmount, cur.advanceAmount), razorpayPaymentId: paymentId ?? cur.razorpayPaymentId },
    });
  });
  await notifyOnce(b.id);
  return b;
}

export async function markFailed(id: string) {
  await prisma.$transaction([
    prisma.showBooking.updateMany({ where: { id, status: "PENDING" }, data: { status: "FAILED" } }),
    prisma.calendarDay.deleteMany({ where: { bookingId: id, kind: "HOLD" } }),
  ]);
}

/** Customer closed the payment window and changed their choices: free the date if nothing was paid. */
export async function releaseHold(id: string) {
  await ensureBookingTables();
  const b = await prisma.showBooking.findUnique({ where: { id } });
  if (!b || b.status !== "PENDING") return;
  if (b.razorpayOrderId) {
    const payments = (await razorpay().orders.fetchPayments(b.razorpayOrderId).catch(() => null)) as { items?: { status: string; id: string }[] } | null;
    if (!payments) return; // can't tell: keep the hold, it expires by itself
    const paid = payments.items?.find((p) => p.status === "captured" || p.status === "authorized");
    if (paid) {
      if (paid.status === "captured") await confirmShowPayment(b.id, paid.id);
      return;
    }
  }
  await markFailed(b.id);
}

// ---------- Admin actions ----------

/** Confirms a booking request (or moves a conflicting one onto a free date). Throws if the date is taken. */
export async function adminConfirm(id: string, date?: string) {
  await ensureBookingTables();
  const cur0 = await prisma.showBooking.findUniqueOrThrow({ where: { id } });
  const target = date || cur0.date;
  if (!isDayKey(target)) throw new BookingError("Invalid date");
  const b = await prisma.$transaction(async (tx) => {
    await lockDay(tx, target);
    const cur = await tx.showBooking.findUniqueOrThrow({ where: { id } });
    const why = await dayTakenReason(tx, target, cur.id);
    if (why) throw new BookingError(why, 409);
    await putOnDay(tx, target, cur.id, "BOOKED");
    return tx.showBooking.update({ where: { id }, data: { status: "CONFIRMED", date: target } });
  });
  return b;
}

export async function adminCancel(id: string) {
  await ensureBookingTables();
  await prisma.$transaction([
    prisma.showBooking.update({ where: { id }, data: { status: "CANCELLED" } }),
    prisma.calendarDay.deleteMany({ where: { bookingId: id } }),
  ]);
}

/** Blocks every free date in the range. Returns how many were blocked and which were skipped. */
export async function blockDates(from: string, to: string, note: string | null, by: string) {
  await ensureBookingTables();
  if (!isDayKey(from) || !isDayKey(to) || to < from) throw new BookingError("Invalid dates");
  const dates: string[] = [];
  for (let d = from; d <= to && dates.length < 366; d = addDays(d, 1)) dates.push(d);
  const skipped: string[] = [];
  for (const date of dates) {
    await prisma.$transaction(async (tx) => {
      await lockDay(tx, date);
      const day = await tx.calendarDay.findUnique({ where: { date } });
      const expired = day?.kind === "HOLD" && (!day.holdUntil || day.holdUntil < new Date());
      if (day && day.kind === "BLOCKED") return void (await tx.calendarDay.update({ where: { date }, data: { note } }));
      if (day && !expired) return void skipped.push(date);
      if (day) await tx.calendarDay.delete({ where: { date } });
      await tx.calendarDay.create({ data: { date, kind: "BLOCKED", note, createdBy: by } });
    });
  }
  return { blocked: dates.length - skipped.length, skipped };
}

export async function unblockDate(date: string) {
  await ensureBookingTables();
  await prisma.calendarDay.deleteMany({ where: { date, kind: "BLOCKED" } });
}

/** Everything on the admin calendar between from and to. */
export async function adminCalendar(from: string, to: string) {
  await ensureBookingTables();
  const [days, bookings, events] = await Promise.all([
    prisma.calendarDay.findMany({ where: { date: { gte: from, lte: to }, ...liveDay } }),
    prisma.showBooking.findMany({
      where: { date: { gte: from, lte: to }, status: { in: ["CONFIRMED", "REQUESTED", "CONFLICT", "PENDING"] } },
      select: { id: true, ref: true, date: true, status: true, name: true, phone: true, serviceName: true, locationName: true, total: true, paidAmount: true },
      orderBy: { createdAt: "asc" },
    }),
    eventDays(prisma, from, to),
  ]);
  return { days, bookings, events };
}

// ---------- Notifications ----------

/** Owner alert + customer email, exactly once per booking. */
export async function notifyOnce(id: string) {
  const claim = await prisma.showBooking.updateMany({ where: { id, notifiedAt: null, status: { in: ["CONFIRMED", "REQUESTED", "CONFLICT"] } }, data: { notifiedAt: new Date() } });
  if (claim.count !== 1) return;
  const b = await prisma.showBooking.findUniqueOrThrow({ where: { id } });
  const [{ sendShowBookingEmails }, { whatsappShowBookingAlert }] = await Promise.all([import("./email"), import("./whatsapp")]);
  await Promise.allSettled([sendShowBookingEmails(b, { owner: true, customer: true }), whatsappShowBookingAlert(b)]);
}
