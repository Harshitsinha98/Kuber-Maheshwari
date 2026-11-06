"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAccess } from "@/lib/auth";
import type { Perm } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ensureBookingTables } from "@/lib/booking-tables";
import { services as siteServices } from "@/lib/site";
import { BookingError, adminCancel, adminConfirm, blockDates, saveRules, unblockDate } from "@/lib/show-booking";

export type ActionState = { ok?: string; error?: string } | undefined;

async function need(perm: Perm | Perm[]) {
  const s = await requireAccess(perm);
  if (!s) throw new Error("Not authorised");
  await ensureBookingTables();
  return s;
}

const paise = (rupees: number) => Math.round(rupees * 100);
const issues = (e: z.ZodError) => e.issues.map((i) => i.message).join(", ");
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

const refreshSetup = () => {
  revalidatePath("/admin/booking-setup");
  revalidatePath("/booking");
};
const refreshBookings = (id?: string) => {
  revalidatePath("/admin/show-bookings");
  if (id) revalidatePath(`/admin/show-bookings/${id}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/booking");
};
const fail = (e: unknown): ActionState => ({ error: e instanceof BookingError ? e.message : (e as Error).message || "Something went wrong" });

// ---------- Rules ----------

const RulesIn = z.object({
  advancePercent: z.coerce.number().int().min(0, "Advance can't be below 0%").max(100, "Advance can't be above 100%"),
  minNoticeDays: z.coerce.number().int().min(0).max(60),
  maxMonthsAhead: z.coerce.number().int().min(1).max(36),
});

export async function saveRulesAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await need("pricing");
  const p = RulesIn.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: issues(p.error) };
  await saveRules(p.data);
  refreshSetup();
  return { ok: `Saved. Customers now pay ${p.data.advancePercent}% advance online.` };
}

// ---------- Programmes (services) ----------

const ServiceIn = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required").max(80),
  nameHi: z.string().trim().max(80).optional(),
  description: z.string().trim().max(300).optional(),
  basePrice: z.coerce.number().min(0, "Price can't be negative").max(10_000_000),
  sortOrder: z.coerce.number().int().default(0),
  active: checkbox,
});

export async function saveService(_p: ActionState, fd: FormData): Promise<ActionState> {
  await need("pricing");
  const p = ServiceIn.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: issues(p.error) };
  const { id, ...d } = p.data;
  const data = { ...d, nameHi: d.nameHi || null, description: d.description || null, basePrice: paise(d.basePrice) };
  if (id) await prisma.bookingService.update({ where: { id }, data });
  else await prisma.bookingService.create({ data });
  refreshSetup();
  return { ok: "Saved" };
}

export async function deleteService(id: string) {
  await need("pricing");
  await prisma.bookingService.delete({ where: { id } });
  // Questions that were only for this programme would otherwise be asked for every programme.
  const qs = await prisma.bookingQuestion.findMany({ where: { serviceIds: { has: id } } });
  for (const q of qs) {
    const rest = q.serviceIds.filter((s) => s !== id);
    await prisma.bookingQuestion.update({ where: { id: q.id }, data: rest.length ? { serviceIds: rest } : { serviceIds: [], active: false } });
  }
  refreshSetup();
}

// ---------- Locations ----------

const LocationIn = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Location name is required").max(80),
  travelCost: z.coerce.number().min(0, "Travel expense can't be negative").max(10_000_000),
  note: z.string().trim().max(200).optional(),
  sortOrder: z.coerce.number().int().default(0),
  active: checkbox,
});

export async function saveLocation(_p: ActionState, fd: FormData): Promise<ActionState> {
  await need("pricing");
  const p = LocationIn.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: issues(p.error) };
  const { id, ...d } = p.data;
  const data = { ...d, note: d.note || null, travelCost: paise(d.travelCost) };
  if (id) await prisma.bookingLocation.update({ where: { id }, data });
  else await prisma.bookingLocation.create({ data });
  refreshSetup();
  return { ok: "Saved" };
}

export async function deleteLocation(id: string) {
  await need("pricing");
  await prisma.bookingLocation.delete({ where: { id } });
  refreshSetup();
}

// ---------- Questions ----------

const OptionIn = z.object({ id: z.string().min(1).max(40), label: z.string().trim().min(1, "Every option needs a label").max(80), price: z.coerce.number().min(0).max(10_000_000) });

const QuestionIn = z
  .object({
    id: z.string().optional(),
    label: z.string().trim().min(2, "Question is required").max(120),
    labelHi: z.string().trim().max(120).optional(),
    help: z.string().trim().max(200).optional(),
    kind: z.enum(["CHOICE", "NUMBER", "TEXT"]),
    required: checkbox,
    active: checkbox,
    unitPrice: z.coerce.number().min(0).max(1_000_000).default(0),
    freeUnits: z.coerce.number().int().min(0).default(0),
    minValue: z.string().optional(),
    maxValue: z.string().optional(),
    sortOrder: z.coerce.number().int().default(0),
    options: z.string().transform((s, ctx) => {
      try {
        return z.array(OptionIn).parse(JSON.parse(s || "[]"));
      } catch (e) {
        ctx.addIssue({ code: "custom", message: e instanceof z.ZodError ? issues(e) : "Invalid options" });
        return z.NEVER;
      }
    }),
    serviceIds: z.string().transform((s) => (s ? s.split(",").filter(Boolean) : [])),
  })
  .refine((q) => q.kind !== "CHOICE" || q.options.length >= 2, { message: "A choice question needs at least 2 options" });

const optInt = (s?: string) => (s && s.trim() !== "" && Number.isFinite(Number(s)) ? Math.floor(Number(s)) : null);

export async function saveQuestion(_p: ActionState, fd: FormData): Promise<ActionState> {
  await need("pricing");
  const p = QuestionIn.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: issues(p.error) };
  const { id, ...d } = p.data;
  const minValue = optInt(d.minValue);
  const maxValue = optInt(d.maxValue);
  if (minValue != null && maxValue != null && minValue > maxValue) return { error: "Minimum is larger than maximum" };
  const data = {
    label: d.label,
    labelHi: d.labelHi || null,
    help: d.help || null,
    kind: d.kind,
    required: d.required,
    active: d.active,
    sortOrder: d.sortOrder,
    serviceIds: d.serviceIds,
    options: d.kind === "CHOICE" ? d.options.map((o) => ({ ...o, price: paise(o.price) })) : [],
    unitPrice: d.kind === "NUMBER" ? paise(d.unitPrice) : 0,
    freeUnits: d.kind === "NUMBER" ? d.freeUnits : 0,
    minValue: d.kind === "NUMBER" ? minValue : null,
    maxValue: d.kind === "NUMBER" ? maxValue : null,
  };
  if (id) await prisma.bookingQuestion.update({ where: { id }, data });
  else await prisma.bookingQuestion.create({ data });
  refreshSetup();
  return { ok: "Saved" };
}

export async function deleteQuestion(id: string) {
  await need("pricing");
  await prisma.bookingQuestion.delete({ where: { id } });
  refreshSetup();
}

/** One click starting point: the site's programmes (switched off until prices are set), Indore, and a guests question. */
export async function loadStarterSetup() {
  await need("pricing");
  if ((await prisma.bookingService.count()) === 0)
    await prisma.bookingService.createMany({
      data: siteServices.map((s, i) => ({ name: s.en, nameHi: s.hi, description: s.desc.slice(0, 300), basePrice: 0, active: false, sortOrder: i })),
    });
  if ((await prisma.bookingLocation.count()) === 0)
    await prisma.bookingLocation.create({ data: { name: "Indore (इंदौर)", travelCost: 0, note: "No travelling expense inside Indore", sortOrder: 0 } });
  if ((await prisma.bookingQuestion.count()) === 0)
    await prisma.bookingQuestion.create({
      data: {
        label: "How many people are expected?",
        labelHi: "आयोजन में कितने लोग होंगे?",
        kind: "CHOICE",
        required: true,
        options: [
          { id: "g1", label: "100 तक", price: 0 },
          { id: "g2", label: "100 – 500", price: 0 },
          { id: "g3", label: "500 – 2000", price: 0 },
          { id: "g4", label: "2000 से ज़्यादा", price: 0 },
        ],
      },
    });
  refreshSetup();
}

// ---------- Calendar ----------

const DateRange = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date"),
  to: z.string().optional(),
  note: z.string().trim().max(200).optional(),
});

export async function blockDatesAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const s = await need("calendar");
  const p = DateRange.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: issues(p.error) };
  try {
    const r = await blockDates(p.data.from, p.data.to || p.data.from, p.data.note || null, s.user.email || "admin");
    refreshBookings();
    return r.skipped.length
      ? { ok: `Blocked ${r.blocked} date(s). Skipped ${r.skipped.join(", ")} (already booked or being booked).` }
      : { ok: `Blocked ${r.blocked} date${r.blocked === 1 ? "" : "s"}.` };
  } catch (e) {
    return fail(e);
  }
}

export async function unblockDateAction(date: string) {
  await need("calendar");
  await unblockDate(date);
  refreshBookings();
}

// ---------- Show bookings ----------

export async function confirmShowBookingAction(id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  await need("showbookings");
  const date = String(fd.get("date") || "").trim() || undefined;
  try {
    const b = await adminConfirm(id, date);
    const { sendShowBookingEmails } = await import("@/lib/email");
    await sendShowBookingEmails(b, { customer: true }).catch(() => {});
    refreshBookings(id);
    return { ok: `Confirmed for ${b.date}. The date is now booked on the calendar.` };
  } catch (e) {
    return fail(e);
  }
}

export async function cancelShowBookingAction(id: string): Promise<ActionState> {
  await need("showbookings");
  try {
    await adminCancel(id);
    refreshBookings(id);
    return { ok: "Cancelled. The date is free again. Refund any advance from the Razorpay dashboard." };
  } catch (e) {
    return fail(e);
  }
}

export async function recordPaymentAction(id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  await need("showbookings");
  if (fd.get("full")) {
    const b = await prisma.showBooking.findUniqueOrThrow({ where: { id }, select: { total: true } });
    await prisma.showBooking.update({ where: { id }, data: { paidAmount: b.total } });
    refreshBookings(id);
    return { ok: "Marked as fully paid" };
  }
  const amount = Number(fd.get("paid"));
  if (!Number.isFinite(amount) || amount < 0) return { error: "Enter the total amount received so far" };
  await prisma.showBooking.update({ where: { id }, data: { paidAmount: paise(amount) } });
  refreshBookings(id);
  return { ok: "Payment updated" };
}

export async function saveAdminNoteAction(id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  await need("showbookings");
  await prisma.showBooking.update({ where: { id }, data: { adminNote: String(fd.get("note") || "").trim().slice(0, 2000) || null } });
  refreshBookings(id);
  return { ok: "Note saved" };
}
