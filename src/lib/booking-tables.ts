import { prisma } from "./prisma";

/**
 * Creates the show-booking tables if the database predates this feature, so the owner does not
 * have to run SQL by hand (same idea as team-table.ts). Mirrors prisma/schema.prisma; every
 * statement is idempotent. Runs at most once per server instance.
 */
const ENUMS = [
  `CREATE TYPE "ShowBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REQUESTED', 'CONFLICT', 'FAILED', 'CANCELLED')`,
  `CREATE TYPE "CalendarDayKind" AS ENUM ('HOLD', 'BOOKED', 'BLOCKED')`,
  `CREATE TYPE "QuestionKind" AS ENUM ('CHOICE', 'NUMBER', 'TEXT')`,
];

const TABLES = [
  `CREATE TABLE IF NOT EXISTS "BookingService" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "nameHi" TEXT, "description" TEXT,
    "basePrice" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookingService_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "BookingLocation" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "travelCost" INTEGER NOT NULL DEFAULT 0, "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookingLocation_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "BookingQuestion" (
    "id" TEXT NOT NULL, "label" TEXT NOT NULL, "labelHi" TEXT, "help" TEXT,
    "kind" "QuestionKind" NOT NULL DEFAULT 'CHOICE', "required" BOOLEAN NOT NULL DEFAULT true,
    "options" JSONB NOT NULL DEFAULT '[]', "unitPrice" INTEGER NOT NULL DEFAULT 0, "freeUnits" INTEGER NOT NULL DEFAULT 0,
    "minValue" INTEGER, "maxValue" INTEGER, "serviceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookingQuestion_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "CalendarDay" (
    "date" TEXT NOT NULL, "kind" "CalendarDayKind" NOT NULL, "bookingId" TEXT, "holdUntil" TIMESTAMP(3),
    "note" TEXT, "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarDay_pkey" PRIMARY KEY ("date"))`,
  `CREATE TABLE IF NOT EXISTS "ShowBooking" (
    "id" TEXT NOT NULL, "ref" TEXT NOT NULL, "userId" TEXT, "date" TEXT NOT NULL,
    "serviceId" TEXT, "serviceName" TEXT NOT NULL, "locationId" TEXT, "locationName" TEXT NOT NULL, "venue" TEXT NOT NULL,
    "name" TEXT NOT NULL, "phone" TEXT NOT NULL, "email" TEXT, "message" TEXT, "answers" JSONB NOT NULL DEFAULT '[]',
    "basePrice" INTEGER NOT NULL, "travelCost" INTEGER NOT NULL, "extrasPrice" INTEGER NOT NULL, "total" INTEGER NOT NULL,
    "advancePercent" INTEGER NOT NULL, "advanceAmount" INTEGER NOT NULL, "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "status" "ShowBookingStatus" NOT NULL DEFAULT 'PENDING', "razorpayOrderId" TEXT, "razorpayPaymentId" TEXT,
    "adminNote" TEXT, "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShowBooking_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CalendarDay_bookingId_key" ON "CalendarDay"("bookingId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ShowBooking_ref_key" ON "ShowBooking"("ref")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ShowBooking_razorpayOrderId_key" ON "ShowBooking"("razorpayOrderId")`,
  `CREATE INDEX IF NOT EXISTS "ShowBooking_date_idx" ON "ShowBooking"("date")`,
  `CREATE INDEX IF NOT EXISTS "ShowBooking_status_idx" ON "ShowBooking"("status")`,
];

// Columns added after the first release. Safe to run on every start.
const UPGRADES = [
  `ALTER TABLE "ShowBooking" ADD COLUMN IF NOT EXISTS "userId" TEXT`,
  `CREATE INDEX IF NOT EXISTS "ShowBooking_userId_idx" ON "ShowBooking"("userId")`,
];

async function create() {
  const [{ ok }] = await prisma.$queryRaw<{ ok: boolean }[]>`SELECT to_regclass('public."ShowBooking"') IS NOT NULL
    AND to_regclass('public."CalendarDay"') IS NOT NULL AND to_regclass('public."BookingQuestion"') IS NOT NULL AS ok`;
  if (!ok) {
    for (const e of ENUMS) await prisma.$executeRawUnsafe(`DO $$ BEGIN ${e}; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    for (const t of TABLES) await prisma.$executeRawUnsafe(t);
  }
  for (const u of UPGRADES) await prisma.$executeRawUnsafe(u);
}

let ready: Promise<void> | null = null;

/** Call before using the show-booking tables. Cheap after the first call. */
export function ensureBookingTables() {
  ready ??= create().catch((e) => {
    ready = null; // try again on the next request
    throw e;
  });
  return ready;
}
