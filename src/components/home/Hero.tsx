"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Magnetic } from "@/components/motion/Reveal";

const ease = [0.16, 1, 0.3, 1] as const;
const ramp = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));

// Deterministic "embers": the petals/bubbles seen in his stage photos, but subtle.
const embers = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 2 + ((i * 7) % 4),
  delay: (i * 0.63) % 8,
  dur: 9 + ((i * 5) % 9),
}));

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Arch (मेहराब) frame opens up to full screen as you scroll.
  // Start size comes from CSS vars (--aw/--ah) so mobile and desktop can differ without JS.
  const width = useTransform(scrollYProgress, (v) => `calc(var(--aw) + (100vw - var(--aw)) * ${ramp(v, 0, 0.7)})`);
  const height = useTransform(scrollYProgress, (v) => `calc(var(--ah) + (100vh - var(--ah)) * ${ramp(v, 0, 0.7)})`);
  const radius = useTransform(scrollYProgress, [0, 0.6], ["999px 999px 0px 0px", "0px 0px 0px 0px"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);
  const leftX = useTransform(scrollYProgress, [0, 0.6], ["0vw", "-40vw"]);
  const rightX = useTransform(scrollYProgress, [0, 0.6], ["0vw", "40vw"]);
  // Opacity ramps computed explicitly so they stay clamped at both ends.
  const fade = useTransform(scrollYProgress, (v) => 1 - ramp(v, 0, 0.35));
  const overlay = useTransform(scrollYProgress, (v) => 0.55 * ramp(v, 0.5, 0.9));
  const endText = useTransform(scrollYProgress, (v) => ramp(v, 0.7, 0.9));
  const endY = useTransform(scrollYProgress, (v) => 40 * (1 - ramp(v, 0.7, 0.95)));
  // Invisible buttons must not catch clicks/taps.
  const endPointer = useTransform(scrollYProgress, (v) => (ramp(v, 0.7, 0.9) > 0.6 ? "auto" : "none"));

  return (
    <section ref={ref} className="relative h-[220vh] bg-night">
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden [--ah:54svh] [--aw:70vw] md:[--ah:min(62vh,640px)] md:[--aw:min(34vw,460px)]">
        {/* warm stage glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_70%,rgba(232,130,12,0.22),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_35%_at_50%_20%,rgba(110,26,38,0.35),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {embers.map((e, i) => (
            <motion.span
              key={i}
              className="absolute bottom-[-10px] rounded-full bg-marigold"
              style={{ left: `${e.left}%`, width: e.size, height: e.size, filter: "blur(0.5px)" }}
              animate={{ y: ["0vh", "-105vh"], opacity: [0, 0.9, 0], x: [0, (i % 2 ? 1 : -1) * 30, 0] }}
              transition={{ duration: e.dur, delay: e.delay, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </div>

        {/* Name, split around the arch */}
        <motion.div style={{ opacity: fade }} className="pointer-events-none absolute inset-x-0 top-[11.5vh] z-20 text-center md:top-[13vh]">
          <motion.p
            initial={{ opacity: 0, wordSpacing: "1.4em", y: 10 }}
            animate={{ opacity: 1, wordSpacing: "0.5em", y: 0 }}
            transition={{ duration: 1.8, ease, delay: 0.2 }}
            className="font-hindi text-lg text-gold md:text-xl"
          >
            कुबेर माहेश्वरी
          </motion.p>
        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[13svh] top-[18.5svh] z-10 flex flex-col justify-between px-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:flex-row md:items-center md:px-8">
          <motion.h1 style={{ x: leftX, opacity: fade }} className="font-display text-[21vw] font-medium leading-none tracking-[-0.03em] text-ivory md:text-[11.5vw]">
            <span className="block overflow-hidden">
              <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 1.4, ease, delay: 0.35 }}>
                Kuber
              </motion.span>
            </span>
          </motion.h1>
          <motion.span style={{ x: rightX, opacity: fade }} className="self-end font-display text-[16vw] font-medium italic leading-none tracking-[-0.03em] text-gold md:self-auto md:text-[11.5vw]" aria-hidden>
            <span className="block overflow-hidden">
              <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 1.4, ease, delay: 0.5 }}>
                Maheshwari
              </motion.span>
            </span>
          </motion.span>
        </div>

        <motion.div
          style={{ width, height, borderRadius: radius }}
          initial={{ clipPath: "inset(100% 0 0 0)" }}
          animate={{ clipPath: "inset(0% 0 0 0)" }}
          transition={{ duration: 1.6, ease, delay: 0.15 }}
          className="relative z-[5] mt-[4vh] overflow-hidden md:mt-[10vh]"
        >
          <motion.div style={{ scale: imgScale }} className="absolute inset-0">
            <Image
              src="/images/gallery/kuber-04.webp"
              alt="Kuber Maheshwari singing live on stage"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[50%_25%]"
            />
          </motion.div>
          <motion.div style={{ opacity: overlay }} className="absolute inset-0 bg-night" />
          <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent" />

          <motion.div style={{ opacity: endText, y: endY, pointerEvents: endPointer }} className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-gold">Sangeetmay Shri Sundarkand</p>
            <p className="mt-5 max-w-4xl font-display text-4xl leading-[1.05] text-ivory md:text-7xl">
              Where <span className="italic text-gold">bhakti</span> meets the stage.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Magnetic>
                <Link href="/events" className="inline-flex h-14 items-center rounded-full bg-saffron px-8 text-sm font-semibold uppercase tracking-[0.16em] text-night hover:bg-marigold">
                  Upcoming events
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href="/booking" className="inline-flex h-14 items-center rounded-full border border-ivory/30 px-8 text-sm uppercase tracking-[0.16em] text-ivory backdrop-blur hover:border-gold hover:text-gold">
                  Invite for your event
                </Link>
              </Magnetic>
            </div>
          </motion.div>
        </motion.div>

        <motion.div style={{ opacity: fade }} className="absolute bottom-7 left-5 z-20 hidden text-[11px] uppercase tracking-[0.3em] text-muted md:left-10 md:block">
          Bhajan · Sundarkand · Bhakti Fusion
        </motion.div>
        <motion.div style={{ opacity: fade }} className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-muted">
          Scroll
          <span className="relative block h-10 w-px overflow-hidden bg-ivory/15">
            <motion.span className="absolute left-0 top-0 h-4 w-px bg-gold" animate={{ y: [-16, 40] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
