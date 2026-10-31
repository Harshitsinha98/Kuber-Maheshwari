import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { ALL_PERMS, can, isOwnerKind, isPerm, type Access, type Perm } from "./permissions";

const list = (v?: string) =>
  (v || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export const ownerEmails = () => list(process.env.ADMIN_EMAILS);
/** Old env-based gate volunteers: still work, as employees who can only scan. */
export const envStaffEmails = () => list(process.env.STAFF_EMAILS);

/**
 * Who this Google account is in the admin panel. Always read fresh from the DB on admin
 * pages/actions, so removing someone or changing their rights takes effect immediately.
 * Owners (ADMIN_EMAILS) can never be locked out from the panel.
 */
export async function getAccess(email?: string | null): Promise<Access> {
  const e = (email || "").trim().toLowerCase();
  if (!e) return { kind: "none", perms: [] };
  if (ownerEmails().includes(e)) return { kind: "owner", perms: [...ALL_PERMS] };
  const m = await prisma.teamMember.findUnique({ where: { email: e } }).catch((err) => {
    console.error("[team]", (err as Error).message);
    return null;
  });
  if (m?.role === "ADMIN") return { kind: "coowner", perms: [...ALL_PERMS] };
  if (m?.role === "STAFF") {
    const perms = m.permissions.filter(isPerm);
    return perms.length ? { kind: "employee", perms } : { kind: "none", perms: [] };
  }
  if (envStaffEmails().includes(e)) return { kind: "employee", perms: ["scan"] };
  return { kind: "none", perms: [] };
}

export const roleFor = (a: Access): Role => (isOwnerKind(a.kind) ? "ADMIN" : a.kind === "employee" ? "STAFF" : "USER");

// The session cookie caches role/permissions for public pages; refresh it at most every minute.
const ACCESS_TTL = 60_000;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      if (user || !token.accessAt || Date.now() - (token.accessAt as number) > ACCESS_TTL) {
        const a = await getAccess(token.email);
        token.role = roleFor(a);
        token.perms = a.perms;
        token.accessAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as Role;
        session.user.perms = (token.perms as Perm[]) || [];
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      const role = roleFor(await getAccess(user.email));
      if (user.id) await prisma.user.update({ where: { id: user.id }, data: { role } }).catch(() => {});
    },
  },
};

export const getSession = () => getServerSession(authOptions);

/** Signed-in session + fresh access, or null if the person may not do this. No perm = owner/co-owner only. */
export async function requireAccess(perm?: Perm | Perm[]) {
  const s = await getSession();
  if (!s?.user) return null;
  const access = await getAccess(s.user.email);
  const ok = perm ? can(access, perm) : isOwnerKind(access.kind);
  return ok ? { ...s, access } : null;
}
