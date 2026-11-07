"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { WEEKDAYS_EN, monthCells, monthTitle, shiftMonth } from "@/lib/calendar-grid";
import { fmtDayKey, inr } from "@/lib/format";
import { blockDatesAction, unblockDateAction, type ActionState } from "../booking-actions";
import { Badge, btn, btnGhost } from "../ui";

export type AdminDay = { kind: "HOLD" | "BOOKED" | "BLOCKED"; note: string | null; bookingId: string | null };
export type AdminBooking = { id: string; ref: string; date: string; status: string; name: string; phone: string; serviceName: string; locationName: string; total: number; paidAmount: number };
export type AdminEvent = { id: string; date: string; title: string };

const tone = (s: string) => (s === "CONFIRMED" ? "green" : s === "REQUESTED" ? "blue" : s === "CONFLICT" ? "red" : "amber") as "green" | "blue" | "red" | "amber";

export default function AdminCalendar({
  month,
  today,
  days,
  bookings,
  events,
}: {
  month: string;
  today: string;
  days: Record<string, AdminDay>;
  bookings: AdminBooking[];
  events: AdminEvent[];
}) {
  const [sel, setSel] = useState<string>(today.slice(0, 7) === month ? today : `${month}-01`);
  const [state, block, pending] = useActionState<ActionState, FormData>(blockDatesAction, undefined);
  const cells = monthCells(month);
  const byDate = (d: string) => ({
    day: days[d],
    bookings: bookings.filter((b) => b.date === d),
    events: events.filter((e) => e.date === d),
  });
  const s = byDate(sel);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-3xl border border-[#ecdfc7] bg-white p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href={`?m=${shiftMonth(month, -1)}`} className={btnGhost} aria-label="Previous month">
            ←
          </Link>
          <div className="text-center">
            <p className="font-display text-2xl">{monthTitle(month, "en")}</p>
            <p className="font-hindi text-sm text-kumkum">{monthTitle(month, "hi")}</p>
          </div>
          <Link href={`?m=${shiftMonth(month, 1)}`} className={btnGhost} aria-label="Next month">
            →
          </Link>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-widest text-ink/45">
          {WEEKDAYS_EN.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c) => {
            const x = byDate(c.key);
            const live = x.bookings.filter((b) => b.status !== "PENDING");
            const kind = x.day?.kind;
            const bg =
              kind === "BOOKED" || x.events.length
                ? "bg-[#fde7e4] text-kumkum"
                : kind === "BLOCKED"
                  ? "bg-stone-200 text-stone-600 [background-image:repeating-linear-gradient(135deg,transparent_0_6px,rgba(0,0,0,.06)_6px_8px)]"
                  : kind === "HOLD"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-[#f4fbf3] text-green-900";
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setSel(c.key)}
                className={`relative flex aspect-square flex-col items-start rounded-xl p-1.5 text-left text-sm transition-all md:p-2 ${bg} ${c.inMonth ? "" : "opacity-35"} ${
                  sel === c.key ? "ring-2 ring-saffron ring-offset-1" : "hover:ring-1 hover:ring-[#dccfb6]"
                } ${c.key < today ? "saturate-50" : ""}`}
              >
                <span className={`font-semibold tabular-nums ${c.key === today ? "rounded-full bg-ink px-1.5 text-ivory" : ""}`}>{c.day}</span>
                <span className="mt-auto hidden w-full truncate text-[10px] leading-tight md:block">
                  {kind === "BLOCKED" ? x.day?.note || "Blocked" : x.events[0]?.title || live.find((b) => b.status === "CONFIRMED")?.name || (kind === "HOLD" ? "Paying…" : "")}
                </span>
                {live.some((b) => b.status === "REQUESTED" || b.status === "CONFLICT") && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sky-500" aria-label="Has requests" />}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink/60">
          <span className="flex items-center gap-1.5">
            <i className="h-3 w-3 rounded bg-[#f4fbf3] ring-1 ring-green-200" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-3 w-3 rounded bg-[#fde7e4]" /> Booked / programme
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-3 w-3 rounded bg-stone-300" /> Blocked by you
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-3 w-3 rounded bg-amber-100" /> Customer paying now
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-sky-500" /> Request waiting
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-[#ecdfc7] bg-white p-5">
          <p className="text-xs uppercase tracking-widest text-ink/50">Selected date</p>
          <p className="font-display text-2xl">{fmtDayKey(sel, "en")}</p>
          <p className="font-hindi text-sm text-kumkum">{fmtDayKey(sel, "hi")}</p>

          <div className="mt-4 space-y-3">
            {s.events.map((e) => (
              <Link key={e.id} href={`/admin/events/${e.id}`} className="block rounded-2xl bg-[#fde7e4] px-4 py-3 text-sm hover:underline">
                🎟️ Programme: <b>{e.title}</b>
              </Link>
            ))}
            {s.bookings.map((b) => (
              <Link key={b.id} href={`/admin/show-bookings/${b.id}`} className="block rounded-2xl border border-[#ecdfc7] px-4 py-3 text-sm hover:bg-[#fffaf0]">
                <div className="flex items-center justify-between gap-2">
                  <b>{b.name}</b>
                  <Badge tone={tone(b.status)}>{b.status === "PENDING" ? "PAYING NOW" : b.status}</Badge>
                </div>
                <div className="text-ink/60">
                  {b.serviceName} · {b.locationName}
                </div>
                <div className="text-ink/60">
                  {inr(b.paidAmount)} paid of {inr(b.total)} · {b.ref}
                </div>
              </Link>
            ))}
            {s.day?.kind === "BLOCKED" && (
              <div className="rounded-2xl bg-stone-100 px-4 py-3 text-sm">
                <p>
                  ⛔ Blocked{s.day.note ? `: ${s.day.note}` : ""}
                </p>
                <form action={unblockDateAction.bind(null, sel)} className="mt-2">
                  <button className={btnGhost}>Unblock this date</button>
                </form>
              </div>
            )}
            {!s.day && !s.events.length && !s.bookings.length && <p className="rounded-2xl bg-[#f4fbf3] px-4 py-3 text-sm text-green-900">✓ Free. Customers can book this date.</p>}
          </div>
        </div>

        <form action={block} className="space-y-3 rounded-3xl border border-[#ecdfc7] bg-white p-5" key={sel}>
          <p className="font-display text-xl">Block dates</p>
          <p className="text-sm text-ink/60">Close dates you are not available, or that were booked offline (phone / in person). Customers will see them as unavailable.</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-ink/70">From</span>
              <input type="date" name="from" defaultValue={sel} required className="admin-input" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink/70">To (optional)</span>
              <input type="date" name="to" min={sel} className="admin-input" />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-ink/70">Note (only you see this)</span>
            <input name="note" placeholder="e.g. Offline booking: Sharma ji, Ujjain" className="admin-input" />
          </label>
          <div className="flex items-center gap-3">
            <button className={btn} disabled={pending}>
              {pending ? "Blocking…" : "Block"}
            </button>
            {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
            {state?.ok && <p className="text-sm text-green-700">✓ {state.ok}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
