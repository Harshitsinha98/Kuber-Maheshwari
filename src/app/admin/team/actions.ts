"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ownerEmails, requireAccess } from "@/lib/auth";
import { isPerm } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export type TeamState = { error?: string; ok?: string } | undefined;

const In = z.object({
  id: z.string().optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid Gmail / Google email"),
  name: z.string().trim().max(80).optional(),
  role: z.enum(["ADMIN", "STAFF"]),
});

/** Only owners (ADMIN_EMAILS) and co-owners may manage the team. */
async function owner() {
  const s = await requireAccess();
  if (!s) throw new Error("Not authorised");
  return s;
}

const me = (s: Awaited<ReturnType<typeof owner>>) => (s.user.email || "").toLowerCase();

// Keeps User.role in step for accounts that already signed in (used for display only; access is checked on every request).
const syncUserRole = (email: string, role: "ADMIN" | "STAFF" | "USER") =>
  prisma.user.updateMany({ where: { email: { equals: email, mode: "insensitive" } }, data: { role } }).catch(() => {});

const tableHint = (e: unknown) =>
  /TeamMember|does not exist|P2021/.test(String((e as Error)?.message ?? e)) ? "The team table is missing in the database. Run the SQL from README → Team & access once." : "Could not save. Please try again.";

export async function saveTeamMember(_prev: TeamState, fd: FormData): Promise<TeamState> {
  const s = await owner();
  const p = In.safeParse({
    id: fd.get("id") || undefined,
    email: fd.get("email"),
    name: fd.get("name") || undefined,
    role: fd.get("role"),
  });
  if (!p.success) return { error: p.error.issues[0]?.message || "Check the form" };
  const { id, email, name, role } = p.data;
  const permissions = role === "STAFF" ? [...new Set(fd.getAll("perms").map(String).filter(isPerm))] : [];

  if (ownerEmails().includes(email)) return { error: "This email is already an owner (set in ADMIN_EMAILS on Vercel)." };
  if (email === me(s)) return { error: "You cannot change your own access. Ask another owner." };
  if (role === "STAFF" && permissions.length === 0) return { error: "Tick at least one section the employee can use." };

  try {
    if (id) {
      const cur = await prisma.teamMember.findUnique({ where: { id } });
      if (!cur) return { error: "This person was already removed." };
      if (cur.email === me(s)) return { error: "You cannot change your own access. Ask another owner." };
      await prisma.teamMember.update({ where: { id }, data: { name: name || null, role, permissions } });
    } else {
      const exists = await prisma.teamMember.findUnique({ where: { email } });
      if (exists) return { error: "Already on the team. Use Edit on their card." };
      await prisma.teamMember.create({ data: { email, name: name || null, role, permissions, addedBy: me(s) } });
    }
  } catch (e) {
    console.error("[team]", e);
    return { error: tableHint(e) };
  }
  await syncUserRole(email, role);
  revalidatePath("/admin/team");
  return { ok: id ? "Saved. New rights apply right away." : `Added. ${email} can now sign in with Google.` };
}

export async function removeTeamMember(id: string) {
  const s = await owner();
  const m = await prisma.teamMember.findUnique({ where: { id } });
  if (!m) return;
  if (m.email === me(s)) throw new Error("You cannot remove yourself");
  await prisma.teamMember.delete({ where: { id } });
  await syncUserRole(m.email, "USER");
  revalidatePath("/admin/team");
}
