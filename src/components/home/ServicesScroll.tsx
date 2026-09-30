"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { services } from "@/lib/site";
import Tracked from "@/components/site/Tracked";

/** Pinned section: vertical scroll drives a horizontal track of service cards (desktop). */
export default function ServicesScroll() {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist]);
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const measure = () => track.current && setDist(Math.max(0, track.current.scrollWidth - window.innerWidth + 80));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <section ref={ref} className="relative bg-ivory text-ink" style={{ height: `calc(100vh + ${dist}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto mb-10 flex w-full max-w-[1500px] items-end justify-between px-5 md:px-10">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-kumkum"><Tracked text="(02) सेवाएँ" /></p>
            <h2 className="mt-4 font-display text-5xl leading-none md:text-7xl">
              Every occasion, <span className="italic text-maroon">its own bhaav.</span>
            </h2>
          </div>
          <Link href="/services" className="hidden text-sm uppercase tracking-[0.2em] text-maroon underline-offset-8 hover:underline md:block">
            All services →
          </Link>
        </div>

        <motion.div ref={track} style={{ x }} className="flex gap-6 pl-5 will-change-transform md:pl-10">
          {services.map((s, i) => (
            <Link
              key={s.slug}
              href={`/services#${s.slug}`}
              data-cursor="Explore"
              className="group relative h-[58vh] w-[78vw] shrink-0 overflow-hidden bg-night text-ivory sm:w-[46vw] lg:w-[30vw]"
            >
              <Image src={s.image} alt={s.en} fill sizes="(max-width:768px) 80vw, 30vw" className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent" />
              <div className="absolute left-6 top-6 font-display text-lg text-gold">{String(i + 1).padStart(2, "0")}</div>
              {s.signature && (
                <div className="absolute right-6 top-6 rounded-full bg-saffron px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-night">Signature</div>
              )}
              <div className="absolute inset-x-6 bottom-6">
                <p className="font-hindi text-2xl text-gold-soft md:text-3xl">{s.hi}</p>
                <p className="mt-1 font-display text-3xl italic md:text-4xl">{s.en}</p>
                <p className="mt-3 max-h-0 overflow-hidden text-sm leading-relaxed text-ivory/75 opacity-0 transition-all duration-700 group-hover:max-h-40 group-hover:opacity-100">
                  {s.desc}
                </p>
              </div>
            </Link>
          ))}
          <div className="w-10 shrink-0" />
        </motion.div>

        <div className="mx-auto mt-10 w-full max-w-[1500px] px-5 md:px-10">
          <div className="h-px w-full bg-ink/10">
            <motion.div style={{ width: bar }} className="h-px bg-maroon" />
          </div>
        </div>
      </div>
    </section>
  );
}
