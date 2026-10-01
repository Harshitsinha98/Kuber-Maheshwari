"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { EventCard } from "@/lib/queries";
import { dayMonth, fmtDateHi, fmtTimeHi, monthHi, rupees } from "@/lib/format";
import { ArrowIcon } from "@/components/site/Icons";

const FALLBACK = "/images/gallery/kuber-25.webp";
// Different stage photos for events without their own poster, so cards don't repeat.
const CARD_FALLBACKS = ["/images/gallery/kuber-41.webp", "/images/gallery/kuber-37.webp", "/images/gallery/kuber-23.webp", "/images/gallery/kuber-06.webp", "/images/gallery/kuber-35.webp"];
const ease = [0.16, 1, 0.3, 1] as const;

const priceHi = (e: EventCard) =>
  e.fromPrice === null ? null : e.fromPrice === 0 ? "प्रवेश निःशुल्क" : `${rupees(e.fromPrice)} से`;

function seatBadge(e: EventCard) {
  if (e.status === "CANCELLED") return { text: "कार्यक्रम रद्द", cls: "bg-ink text-ivory" };
  if (e.seatsLeft === 0) return { text: "हाउसफुल", cls: "bg-kumkum text-ivory" };
  if (typeof e.seatsLeft === "number" && e.capacity && e.seatsLeft <= Math.max(20, e.capacity * 0.2))
    return { text: `सिर्फ़ ${e.seatsLeft} सीटें बाकी`, cls: "bg-kumkum text-ivory animate-pulse" };
  return { text: "टिकट बुकिंग शुरू", cls: "bg-[#1f9d55] text-white" };
}

function useCountdown(iso: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const t = new Date(iso).getTime();
    const tick = () => setLeft(Math.max(0, t - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);
  return left;
}

export function Countdown({ iso }: { iso: string }) {
  const left = useCountdown(iso);
  if (left === null) return <div className="h-[86px]" />;
  if (left === 0)
    return <p className="font-hindi text-2xl text-marigold">कार्यक्रम आज चल रहा है</p>;
  const parts: [number, string][] = [
    [Math.floor(left / 86400e3), "दिन"],
    [Math.floor((left / 3600e3) % 24), "घंटे"],
    [Math.floor((left / 60e3) % 60), "मिनट"],
    [Math.floor((left / 1e3) % 60), "सेकंड"],
  ];
  return (
    <div className="flex gap-2 sm:gap-3" aria-label="Time left">
      {parts.map(([n, l]) => (
        <div key={l} className="min-w-[64px] rounded-xl border border-ivory/15 bg-night/45 px-2 py-2.5 text-center backdrop-blur sm:min-w-[78px]">
          <div className="font-display text-3xl leading-none tabular-nums text-ivory sm:text-4xl">{String(n).padStart(2, "0")}</div>
          <div className="mt-1.5 font-hindi text-xs text-gold-soft">{l}</div>
        </div>
      ))}
    </div>
  );
}

function Featured({ e }: { e: EventCard }) {
  const d = dayMonth(e.startsAt);
  const badge = seatBadge(e);
  const price = priceHi(e);
  const closed = e.status === "CANCELLED" || e.seatsLeft === 0;
  return (
    <motion.article
      data-featured-event
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1, ease }}
      className="relative overflow-hidden rounded-[28px] ring-1 ring-gold/30"
    >
      <div className="toran absolute inset-x-0 top-0 z-20" aria-hidden />
      <div className="relative bg-gradient-to-br from-[#4a0f19] via-[#2a0810] to-night">
        <div className="flame-glow pointer-events-none absolute inset-0" />
        <div className="relative z-10 grid items-center gap-8 p-6 pt-12 md:grid-cols-[1.25fr_0.75fr] md:gap-12 md:p-14">
          <div className="order-2 flex flex-col gap-6 md:order-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3.5 py-1.5 font-hindi text-sm font-semibold ${badge.cls}`}>{badge.text}</span>
              <span className="rounded-full border border-gold/50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-soft">{e.category}</span>
            </div>

            <div className="flex items-center gap-4 md:gap-5">
              <div className="shrink-0 rounded-2xl bg-saffron px-3.5 py-2.5 text-center text-night shadow-[0_10px_40px_-8px_rgba(232,130,12,0.8)] md:px-4 md:py-3">
                <div className="font-display text-4xl font-semibold leading-none md:text-5xl">{d.day}</div>
                <div className="mt-1 font-hindi text-sm leading-none md:text-base">{monthHi(e.startsAt)}</div>
              </div>
              <h3 className={`min-w-0 break-words font-display text-4xl leading-[1.05] text-ivory sm:text-5xl md:text-7xl ${e.status === "CANCELLED" ? "line-through opacity-60" : ""}`}>{e.title}</h3>
            </div>

            <div className="space-y-1 text-ivory/85">
              <p className="font-hindi text-lg">
                {fmtDateHi(e.startsAt)} · {fmtTimeHi(e.startsAt)}
              </p>
              <p className="text-sm text-ivory/70">
                <svg viewBox="0 0 24 24" className="mr-1.5 inline h-4 w-4 -translate-y-px text-saffron" fill="currentColor" aria-hidden>
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
                </svg>
                {e.venueName}, {e.city}
              </p>
            </div>

            {!closed && <Countdown iso={e.startsAt} />}

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={`/events/${e.slug}`}
                className={`shine inline-flex h-16 items-center gap-3 rounded-full px-9 font-hindi text-xl font-semibold shadow-[0_14px_50px_-10px_rgba(232,130,12,0.9)] transition-transform hover:scale-[1.03] ${
                  closed ? "bg-ivory/20 text-ivory" : "bg-saffron text-night"
                }`}
              >
                {closed ? "विवरण देखें" : "टिकट बुक करें"} <ArrowIcon className="h-5 w-5" />
              </Link>
              {price && !closed && (
                <div className="leading-tight">
                  <div className="font-display text-3xl text-ivory">{price.replace(" से", "")}</div>
                  <div className="font-hindi text-sm text-gold-soft">{e.fromPrice === 0 ? "बस रजिस्टर करें" : "से टिकट शुरू"}</div>
                </div>
              )}
            </div>
          </div>

          {/* Poster in a मेहराब (arch) frame, shown at its natural sharpness */}
          <Link href={`/events/${e.slug}`} className="relative order-1 mx-auto block w-[72%] max-w-[380px] md:order-2 md:w-full" aria-label={e.title}>
            <div className="absolute -inset-5 rounded-t-full bg-[radial-gradient(closest-side,rgba(232,130,12,0.5),transparent)] blur-2xl" aria-hidden />
            <div className="relative rounded-t-full border-[3px] border-gold/70 p-1.5 shadow-[0_30px_90px_-25px_rgba(232,130,12,0.7)]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-t-full">
                <Image src={e.posterUrl || FALLBACK} alt={e.title} fill quality={90} sizes="(max-width:768px) 72vw, 380px" className="object-cover object-[50%_30%]" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

function PosterCard({ e, i }: { e: EventCard; i: number }) {
  const d = dayMonth(e.startsAt);
  const badge = seatBadge(e);
  const price = priceHi(e);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, delay: (i % 3) * 0.08, ease }}
    >
      <Link
        href={`/events/${e.slug}`}
        className="group relative block overflow-hidden rounded-3xl ring-1 ring-gold/20 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_70px_-25px_rgba(232,130,12,0.6)] hover:ring-gold/60"
      >
        <div className="relative aspect-[4/5]">
          <Image src={e.posterUrl || CARD_FALLBACKS[i % CARD_FALLBACKS.length]} alt={e.title} fill quality={90} sizes="(max-width:768px) 90vw, 33vw" className="object-cover object-[50%_28%] transition-transform duration-700 group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a0810] via-[#3a0b12]/40 to-transparent" />
          <div className="absolute left-4 top-4 rounded-2xl bg-saffron px-3 py-2 text-center text-night">
            <div className="font-display text-3xl font-semibold leading-none">{d.day}</div>
            <div className="font-hindi text-sm leading-tight">{monthHi(e.startsAt)}</div>
          </div>
          <span className={`absolute right-4 top-4 rounded-full px-3 py-1 font-hindi text-xs font-semibold ${badge.cls}`}>{badge.text}</span>
          <div className="absolute inset-x-5 bottom-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{e.category}</p>
            <h3 className={`mt-1.5 font-display text-3xl leading-tight text-ivory ${e.status === "CANCELLED" ? "line-through opacity-60" : ""}`}>{e.title}</h3>
            <p className="mt-1 text-sm text-ivory/75">
              {e.venueName}, {e.city} · {fmtTimeHi(e.startsAt)}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-hindi text-base text-gold-soft">{price}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-saffron px-4 py-2 font-hindi text-sm font-semibold text-night transition-transform group-hover:scale-105">
                टिकट <ArrowIcon className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/** The big, festive "upcoming events" block: next event featured with a live countdown, the rest as posters. */
export default function EventShowcase({ events }: { events: EventCard[] }) {
  const [first, ...rest] = events;
  if (!first) return null;
  return (
    <div className="space-y-10">
      <Featured e={first} />
      {rest.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((e, i) => (
            <PosterCard key={e.id} e={e} i={i} />
          ))}
        </div>
      )}
    </div>
  );
}
