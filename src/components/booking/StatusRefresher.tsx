"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** While the payment is being confirmed, re-checks the booking every few seconds (up to ~3 minutes). */
export default function StatusRefresher({ seconds = 4 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      if (++n > 45) return clearInterval(id);
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
