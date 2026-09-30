"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { EventCard } from "@/lib/queries";
import { dayMonth, fmtTime, rupees } from "@/lib/format";
import { ArrowIcon } from "@/components/site/Icons";

const fallbackPoster = "/images/gallery/kuber-01.webp";

export default function EventList({ events, past = false }: { events: EventCard[]; past?: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 20 });
  const sy = useSpring(y, { stiffness: 150, damping: 20 });
  const current = events.find((e) => e.id === active);

  return (
    <div
      className="relative"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
      onMouseLeave={() => setActive(null)}
    >
      <ul className="border-t border-ivory/10">
        {events.map((e, i) => {
          const d = dayMonth(e.startsAt);
          const cancelled = e.status === "CANCELLED";
          return (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="border-b border-ivory/10"
              onMouseEnter={() => setActive(e.id)}
            >
              <Link
                href={`/events/${e.slug}`}
                data-cursor={past ? "View" : "Tickets"}
                className="group grid grid-cols-[72px_1fr_auto] items-center gap-4 py-7 outline-none focus-visible:ring-1 focus-visible:ring-gold/60 md:grid-cols-[120px_1fr_220px_160px] md:gap-8 md:py-9"
              >
                <div className="text-center md:text-left">
                  <div className="font-display text-5xl leading-none text-gold md:text-6xl">{d.day}</div>
                  <div className="mt-1 text-[11px] tracking-[0.3em] text-muted">{d.month}</div>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-saffron">{e.category}</p>
                  <h3 className={`mt-2 truncate font-display text-2xl text-ivory transition-all duration-500 group-hover:translate-x-2 group-hover:italic md:text-4xl ${cancelled ? "line-through opacity-50" : ""}`}>
                    {e.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted md:hidden">
                    {e.city} · {fmtTime(e.startsAt)}
                  </p>
                </div>
                <div className="hidden text-sm text-ivory/70 md:block">
                  <div>{e.venueName}</div>
                  <div className="text-muted">
                    {e.city} · {fmtTime(e.startsAt)}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4">
                  <span className="hidden text-sm text-ivory/80 md:block">
                    {cancelled ? "Cancelled" : past ? "" : e.fromPrice === null ? "" : e.fromPrice === 0 ? "Free entry" : `From ${rupees(e.fromPrice)}`}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-ivory/20 transition-all duration-500 group-hover:rotate-45 group-hover:border-gold group-hover:bg-gold group-hover:text-night">
                    <ArrowIcon className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.li>
          );
        })}
      </ul>

      <motion.div style={{ x: sx, y: sy }} className="pointer-events-none absolute left-0 top-0 z-10 hidden lg:block">
        <AnimatePresence>
          {current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: -3 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative -mt-36 ml-10 h-60 w-44 overflow-hidden shadow-2xl ring-1 ring-ivory/10"
            >
              <Image src={current.posterUrl || fallbackPoster} alt="" fill sizes="224px" className="object-cover" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
