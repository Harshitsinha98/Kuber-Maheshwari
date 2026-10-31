import { redirect } from "next/navigation";
import { getAccess, getSession } from "@/lib/auth";
import { can, homeFor, isOwnerKind, type Perm } from "@/lib/permissions";

/**
 * Protects an admin page. Access is read fresh from the DB on every request.
 * - perm: the section this page belongs to (employees need it ticked)
 * - "team": owners and co-owners only
 * - nothing: anyone on the team (used by the layout)
 */
export async function guard(perm?: Perm | Perm[] | "team") {
  const s = await getSession();
  if (!s) redirect("/login?callbackUrl=/admin");
  const access = await getAccess(s.user.email);
  const home = homeFor(access);
  if (!home) redirect("/my-tickets");
  const ok = !perm || (perm === "team" ? isOwnerKind(access.kind) : can(access, perm));
  if (!ok) redirect(home);
  return { ...s, access };
}
