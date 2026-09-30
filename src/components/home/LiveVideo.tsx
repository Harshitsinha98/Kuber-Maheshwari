"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PlayIcon } from "@/components/site/Icons";
import Tracked from "@/components/site/Tracked";

export default function LiveVideo() {
  const ref = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const [sound, setSound] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.78, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [48, 4]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (inView) v.play().catch(() => {});
    else v.pause();
  }, [inView]);

  return (
    <section ref={ref} className="mx-auto max-w-[1500px] px-3 py-20 md:px-10">
      <div className="mb-10 flex items-end justify-between px-2">
        <p className="text-xs uppercase tracking-[0.35em] text-gold"><Tracked text="(06) Live · मंच से" /></p>
        <p className="hidden font-display text-2xl italic text-muted md:block">Feel it, don&apos;t just watch it.</p>
      </div>
      <motion.div style={{ scale, borderRadius: radius }} className="relative aspect-[9/16] overflow-hidden bg-ink sm:aspect-video">
        <video
          ref={video}
          src="/videos/kuber-live.mp4"
          poster="/images/gallery/kuber-01.webp"
          muted={!sound}
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/70 via-transparent" />
        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-night/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-ivory backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-kumkum" /> Live performance
        </div>
        <button
          onClick={() => {
            setSound((s) => !s);
            video.current?.play();
          }}
          data-cursor={sound ? "Mute" : "Sound"}
          className="absolute bottom-6 left-6 flex items-center gap-3 rounded-full bg-ivory px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-night"
        >
          <PlayIcon className="h-4 w-4" /> {sound ? "Sound on" : "Tap for sound"}
        </button>
      </motion.div>
    </section>
  );
}
