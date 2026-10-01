"use client";

import { useEffect } from "react";

/** Registers /sw.js so opened tickets stay available offline. */
export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((e) => console.warn("[sw]", e));
  }, []);
  return null;
}
