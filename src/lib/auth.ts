import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";

const list = (v?: string) =>
  (v || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

/** Roles are driven by env lists, so the owner never needs DB access to grant them. */
export function roleForEmail(email?: string | null): Role {
  const e = (email || "").toLowerCase();
  if (list(process.env.ADMIN_EMAILS).includes(e)) return "ADMIN";
  if (list(process.env.STAFF_EMAILS).includes(e)) return "STAFF";
  return "USER";
}

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
      token.role = roleForEmail(token.email);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      const role = roleForEmail(user.email);
      if (user.id) await prisma.user.update({ where: { id: user.id }, data: { role } }).catch(() => {});
    },
  },
};

export const getSession = () => getServerSession(authOptions);

export async function requireRole(roles: Role[]) {
  const s = await getSession();
  if (!s?.user || !roles.includes(s.user.role)) return null;
  return s;
}
