"use client";

import { useState } from "react";
import { btnGhost } from "./ui";

export default function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={btnGhost}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          window.prompt("Copy this link", url);
        }
      }}
    >
      {done ? "Copied ✓" : "Copy link"}
    </button>
  );
}
