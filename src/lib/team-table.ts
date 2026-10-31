import { prisma } from "./prisma";

/**
 * Creates the TeamMember table if the database predates the Team feature, so the owner does not
 * have to run SQL by hand. Same definition as prisma/schema.prisma; safe to run repeatedly.
 */
export async function ensureTeamTable() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
  )`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_email_key" ON "TeamMember"("email")`);
}

/** Prisma error for a missing table (P2021) or the raw Postgres one. */
export const isMissingTable = (e: unknown) => {
  const err = e as { code?: string; message?: string };
  return err?.code === "P2021" || /TeamMember.*does not exist|relation "TeamMember"/.test(String(err?.message ?? e));
};

/** Runs fn; if the team table is missing, creates it once and retries. */
export async function withTeamTable<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!isMissingTable(e)) throw e;
    await ensureTeamTable();
    return fn();
  }
}
