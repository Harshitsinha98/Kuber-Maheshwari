import type { Role } from "@prisma/client";
import type { Perm } from "@/lib/permissions";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      /** admin sections (cached in the session cookie, refreshed every minute) */
      perms: Perm[];
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
