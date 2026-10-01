"use client";

import { useActionState, useState } from "react";
import { whatsappTestAction } from "../actions";
import { btn, btnGhost } from "../ui";

export function CopyBlock({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="relative mt-3">
      <pre className="whitespace-pre-wrap rounded-xl bg-[#1d1416] p-4 pr-20 font-hindi text-sm leading-relaxed text-ivory">{text}</pre>
      <button
        type="button"
        className="absolute right-2 top-2 rounded-full bg-white/10 px-3 py-1 text-xs text-ivory hover:bg-white/20"
        onClick={async () => {
          await navigator.clipboard.writeText(text).catch(() => {});
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
      >
        {done ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}

export function WhatsappTestForm({ disabled }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState(whatsappTestAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">Message</span>
        <select name="kind" className="admin-input w-56">
          <option value="booking">New booking alert</option>
          <option value="enquiry">New enquiry alert</option>
          <option value="ticket">Ticket to buyer</option>
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">Send to (blank = alert numbers)</span>
        <input name="to" inputMode="tel" className="admin-input w-56" placeholder="98277 51400" />
      </label>
      <button className={btn} disabled={pending || disabled}>
        {pending ? "Sending…" : "Send test"}
      </button>
      {disabled && <span className={btnGhost + " pointer-events-none opacity-70"}>Add the WhatsApp keys first</span>}
      {state && <p className={`w-full rounded-lg p-3 text-sm ${state.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"}`}>{state.error || state.ok}</p>}
    </form>
  );
}
