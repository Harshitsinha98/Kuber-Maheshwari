"use client";

import { useActionState, useRef, useState } from "react";
import { PERMISSIONS, type Perm } from "@/lib/permissions";
import { btn, btnGhost } from "../ui";
import { saveTeamMember, type TeamState } from "./actions";

// One-tap starting points; the owner can still tick/untick anything.
const PRESETS: { label: string; perms: Perm[] }[] = [
  { label: "Gate staff", perms: ["scan"] },
  { label: "Office / bookings", perms: ["dashboard", "events", "bookings", "enquiries", "scan"] },
  { label: "Website editor", perms: ["gallery", "videos", "testimonials", "social"] },
];

type Member = { id: string; email: string; name: string | null; role: "ADMIN" | "STAFF" | "USER"; permissions: string[] };

export default function TeamForm({ member, onDone }: { member?: Member; onDone?: () => void }) {
  const ref = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState<"ADMIN" | "STAFF">(member?.role === "ADMIN" ? "ADMIN" : "STAFF");
  const [perms, setPerms] = useState<Perm[]>((member?.permissions as Perm[]) ?? []);
  const [state, action, pending] = useActionState<TeamState, FormData>(async (p, fd) => {
    const r = await saveTeamMember(p, fd);
    if (r?.ok && !member) {
      ref.current?.reset();
      setRole("STAFF");
      setPerms([]);
    }
    if (r?.ok) onDone?.();
    return r;
  }, undefined);

  const toggle = (k: Perm) => setPerms((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  const roleCard = (value: "ADMIN" | "STAFF", title: string, hi: string, note: string) => (
    <label
      className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors ${role === value ? "border-saffron bg-saffron/10" : "border-[#e5d8bf] bg-white hover:bg-[#faf4e8]"}`}
    >
      <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="mt-1 accent-[#e8820c]" />
      <span>
        <span className="block font-semibold">
          {title} <span className="font-hindi font-normal text-kumkum">· {hi}</span>
        </span>
        <span className="mt-0.5 block text-xs text-ink/60">{note}</span>
      </span>
    </label>
  );

  return (
    <form ref={ref} action={action} className="space-y-5">
      {member && <input type="hidden" name="id" value={member.id} />}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-ink/70">Google / Gmail address</span>
          {member ? (
            <>
              <input type="hidden" name="email" value={member.email} />
              <input value={member.email} disabled className="admin-input opacity-70" />
            </>
          ) : (
            <input name="email" type="email" required className="admin-input" placeholder="name@gmail.com" autoComplete="off" />
          )}
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink/70">Name (optional)</span>
          <input name="name" defaultValue={member?.name ?? ""} className="admin-input" placeholder="e.g. Pankaj" />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {roleCard("ADMIN", "Co-owner", "सह-मालिक", "Exactly the same rights as the owner, including managing this team.")}
        {roleCard("STAFF", "Employee", "कर्मचारी", "Only the sections you tick below.")}
      </div>

      {role === "STAFF" && (
        <div className="rounded-2xl border border-[#ecdfc7] bg-[#fbf7ef] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs uppercase tracking-widest text-ink/50">Quick pick</span>
            {PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => setPerms(p.perms)} className={`${btnGhost} px-3 py-1.5 text-xs`}>
                {p.label}
              </button>
            ))}
            <button type="button" onClick={() => setPerms(PERMISSIONS.map((p) => p.key))} className="px-2 text-xs text-maroon underline-offset-4 hover:underline">
              All
            </button>
            <button type="button" onClick={() => setPerms([])} className="px-2 text-xs text-maroon underline-offset-4 hover:underline">
              None
            </button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PERMISSIONS.map((p) => (
              <label key={p.key} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${perms.includes(p.key) ? "border-saffron/70 bg-white" : "border-transparent bg-white/60"}`}>
                <input type="checkbox" name="perms" value={p.key} checked={perms.includes(p.key)} onChange={() => toggle(p.key)} className="mt-0.5 h-4 w-4 accent-[#e8820c]" />
                <span>
                  <span className="block font-medium">
                    {p.label} <span className="font-hindi text-xs text-kumkum">{p.hi}</span>
                  </span>
                  <span className="block text-xs text-ink/55">{p.note}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button className={btn} disabled={pending}>
          {pending ? "Saving…" : member ? "Save changes" : "Add to team"}
        </button>
        {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
        {state?.ok && <p className="text-sm text-green-700">{state.ok}</p>}
      </div>
    </form>
  );
}
