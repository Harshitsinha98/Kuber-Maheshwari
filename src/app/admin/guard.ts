import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";

export async function guard(roles: Role[] = ["ADMIN"]) {
  const s = await getSession();
  if (!s) redirect("/login?callbackUrl=/admin");
  if (!roles.includes(s.user.role)) redirect(s.user.role === "STAFF" ? "/admin/scan" : "/my-tickets");
  return s;
}
