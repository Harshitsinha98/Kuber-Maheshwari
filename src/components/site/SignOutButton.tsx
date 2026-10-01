"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={async () => {
        // Remove offline copies of tickets from this device before signing out.
        try {
          navigator.serviceWorker?.controller?.postMessage({ type: "clear-tickets" });
          await caches?.delete("km-tickets-v1");
        } catch {}
        signOut({ callbackUrl: "/" });
      }} className={className ?? "text-xs uppercase tracking-[0.18em] text-muted hover:text-ivory"}>
      Sign out
    </button>
  );
}
