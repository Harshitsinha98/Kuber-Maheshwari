"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton({ className }: { className?: string }) {
  return (
    <button onClick={() => signOut({ callbackUrl: "/" })} className={className ?? "text-xs uppercase tracking-[0.18em] text-muted hover:text-ivory"}>
      Sign out
    </button>
  );
}
