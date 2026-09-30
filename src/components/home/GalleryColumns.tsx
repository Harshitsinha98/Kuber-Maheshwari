"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import Tracked from "@/components/site/Tracked";

const cols = [
  ["kuber-02", "kuber-15", "kuber-33"],
  ["kuber-26", "kuber-09", "kuber-41", "kuber-18"],
  ["kuber-35", "kuber-11", "kuber-43"],
  ["kuber-20", "kuber-23", "kuber-05", "kuber-30"],
];

export default function GalleryColumns() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const ys = [
    useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]),
    useTransform(scrollYProgress, [0, 1], ["-12%", "6%"]),
    useTransform(scrollYProgress, [0, 1], ["4%", "-22%"]),
    useTransform(scrollYProgress, [0, 1], ["-16%", "4%"]),
  ];

  return (
    <section ref={ref} className="relative overflow-hidden py-28 md:py-36">
      <div className="mx-auto mb-16 flex max-w-[1500px] items-end justify-between px-5 md:px-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold"><Tracked text="(05) झलकियाँ" /></p>
          <h2 className="mt-4 font-display text-5xl leading-none md:text-7xl">
            Moments of <span className="italic text-gold">devotion</span>
          </h2>
        </div>
        <Link href="/gallery" className="text-sm uppercase tracking-[0.2em] text-gold underline-offset-8 hover:underline">
          Full gallery →
        </Link>
      </div>
      <div className="relative h-[110vh] overflow-hidden">
        <div className="grid h-full grid-cols-2 gap-3 px-3 md:grid-cols-4 md:gap-5 md:px-5">
          {cols.map((c, i) => (
            <motion.div key={i} style={{ y: ys[i] }} className={`flex flex-col gap-3 md:gap-5 ${i > 1 ? "hidden md:flex" : ""}`}>
              {c.map((n) => (
                <Link key={n} href="/gallery" data-cursor="View" className="group relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={`/images/gallery/${n}.webp`}
                    alt="Kuber Maheshwari"
                    fill
                    sizes="(max-width:768px) 50vw, 25vw"
                    className="object-cover grayscale-[35%] transition-all duration-[1.2s] group-hover:scale-105 group-hover:grayscale-0"
                  />
                </Link>
              ))}
            </motion.div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-night" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night" />
      </div>
    </section>
  );
}
