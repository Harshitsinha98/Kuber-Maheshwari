"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { WEEKDAYS_HI, monthCells, monthTitle, shiftMonth } from "@/lib/calendar-grid";

export type DayState = "booked" | "blocked";

const ease = [0.16, 1, 0.3, 1] as const;

const gridV: Variants = {
  hidden: (d: number) => ({ x: d >= 0 ? 60 : -60, opacity: 0 }),
  show: { x: 0, opacity: 1, transition: { duration: 0.5, ease, staggerChildren: 0.012 } },
  exit: (d: number) => ({ x: d >= 0 ? -60 : 60, opacity: 0, transition: { duration: 0.3, ease } }),
};
const cellV: Variants = { hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease } } };

/**
 * Animated month calendar: green-dot dates are free, maroon ones are booked, hatched ones are closed.
 * Dates outside the booking window (too soon / too far / past) are dimmed and can't be picked.
 */
export default function AvailabilityCalendar({
  month,
  dir,
  onMonth,
  days,
  loading,
  first,
  last,
  today,
  selected,
  onSelect,
}: {
  month: string;
  dir: number;
  onMonth: (m: string, dir: number) => void;
  days: Record<string, DayState> | undefined;
  loading: boolean;
  first: string;
  last: string;
  today: string;
  selected: string | null;
  onSelect: (d: string) => void;
}) {
  const cells = monthCells(month);
  const canPrev = month > first.slice(0, 7);
  const canNext = month < last.slice(0, 7);

  const state = (d: string) => {
    if (d < first || d > last) return "out" as const;
    return days?.[d] ?? (days ? ("free" as const) : ("unknown" as const));
  };

  return (
    <div className="relative select-none">
      {/* Month header */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onMonth(shiftMonth(month, -1), -1)}
          disabled={!canPrev}
          aria-label="Previous month"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 text-gold transition-all hover:border-gold hover:bg-gold/10 disabled:opacity-25"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="relative h-16 flex-1 overflow-hidden text-center">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={month}
              custom={dir}
              initial={{ y: dir >= 0 ? 30 : -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: dir >= 0 ? -30 : 30, opacity: 0 }}
              transition={{ duration: 0.45, ease }}
              className="absolute inset-0"
            >
              <p className="font-hindi text-3xl leading-[1.5] text-ivory">{monthTitle(month, "hi")}</p>
              <p className="-mt-1 font-display text-lg italic text-gold">{monthTitle(month, "en")}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={() => onMonth(shiftMonth(month, 1), 1)}
          disabled={!canNext}
          aria-label="Next month"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 text-gold transition-all hover:border-gold hover:bg-gold/10 disabled:opacity-25"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5 text-center font-hindi text-sm text-muted">
        {WEEKDAYS_HI.map((w, i) => (
          <div key={w} className={i === 0 ? "text-saffron/80" : ""}>
            {w}
          </div>
        ))}
      </div>

      <div className="relative mt-2 overflow-hidden">
        <AnimatePresence mode="popLayout" custom={dir}>
          <motion.div
            key={month}
            custom={dir}
            variants={gridV}
            initial="hidden"
            animate="show"
            exit="exit"
            className="grid grid-cols-7 gap-1.5"
            role="grid"
            aria-label={`${monthTitle(month, "en")} availability`}
          >
            {cells.map((c) => {
              const s = state(c.key);
              const isSel = selected === c.key;
              const pickable = c.inMonth && s === "free";
              const label = `${c.day} ${monthTitle(month, "en")}: ${s === "free" ? "available" : s === "booked" ? "booked" : s === "blocked" ? "not available" : "not bookable online"}`;
              return (
                <motion.button
                  key={c.key}
                  type="button"
                  role="gridcell"
                  aria-label={label}
                  aria-selected={isSel}
                  disabled={!pickable}
                  onClick={() => onSelect(c.key)}
                  variants={cellV}
                  whileHover={pickable ? { y: -3 } : undefined}
                  whileTap={pickable ? { scale: 0.92 } : undefined}
                  className={`group relative flex aspect-square flex-col items-center justify-center rounded-2xl text-base transition-colors md:text-lg ${
                    !c.inMonth
                      ? "invisible"
                      : s === "booked"
                        ? "cursor-not-allowed bg-maroon/45 text-ivory/45"
                        : s === "blocked"
                          ? "cursor-not-allowed bg-ivory/[0.04] text-ivory/30 [background-image:repeating-linear-gradient(135deg,transparent_0_7px,rgba(246,238,223,.06)_7px_9px)]"
                          : s === "free"
                            ? "border border-gold/15 bg-night-2/70 text-ivory hover:border-gold/70 hover:shadow-[0_10px_30px_-12px_rgba(212,166,74,0.7)]"
                            : "cursor-not-allowed text-ivory/20"
                  }`}
                >
                  {isSel && (
                    <motion.span layoutId="km-cal-sel" transition={{ type: "spring", stiffness: 420, damping: 32 }} className="absolute inset-0 rounded-2xl bg-saffron shadow-[0_12px_40px_-8px_rgba(232,130,12,0.9)]" />
                  )}
                  <span className={`relative font-display tabular-nums [font-variant-numeric:lining-nums_tabular-nums] ${isSel ? "font-semibold text-night" : ""} ${c.key === today && !isSel ? "text-gold underline decoration-gold/60 underline-offset-4" : ""}`}>
                    {c.day}
                  </span>
                  {c.inMonth && s === "free" && !isSel && (
                    <span className="relative mt-0.5 flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40 group-hover:opacity-80" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                  )}
                  {c.inMonth && s === "booked" && <span className="relative font-hindi text-[10px] leading-none text-marigold/80 md:text-[11px]">बुक</span>}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-night/40 backdrop-blur-[2px]">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" aria-label="Loading" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-hindi text-sm text-ivory/70">
        <span className="flex items-center gap-2">
          <i className="h-2 w-2 rounded-full bg-emerald-400" /> उपलब्ध
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-maroon/70" /> बुक
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-ivory/10 [background-image:repeating-linear-gradient(135deg,transparent_0_3px,rgba(246,238,223,.2)_3px_4px)]" /> उपलब्ध नहीं
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded-full bg-saffron" /> आपकी चुनी तारीख
        </span>
      </div>
    </div>
  );
}
