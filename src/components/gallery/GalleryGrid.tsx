"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { GalleryImage } from "@/lib/queries";

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + images.length) % images.length)), [images.length]);

  useEffect(() => {
    if (open === null) return;
    const lenis = (window as unknown as { lenis?: { stop(): void; start(): void } }).lenis;
    lenis?.stop();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      lenis?.start();
    };
  }, [open, close, step]);

  return (
    <>
      <div className="columns-2 gap-3 md:columns-3 md:gap-5 xl:columns-4">
        {images.map((img, i) => (
          <motion.button
            key={img.src}
            type="button"
            onClick={() => setOpen(i)}
            data-cursor="View"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5% 0px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: (i % 4) * 0.06 }}
            className="group relative mb-3 block w-full overflow-hidden md:mb-5"
          >
            <Image
              src={img.src}
              alt={img.caption || "Kuber Maheshwari"}
              width={img.width}
              height={img.height}
              sizes="(max-width:768px) 50vw, (max-width:1280px) 33vw, 25vw"
              className="h-auto w-full transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 bg-night/0 transition-colors duration-500 group-hover:bg-night/20" />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            className="fixed inset-0 z-[65] flex items-center justify-center bg-night/95 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            role="dialog"
            aria-modal
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={open}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative h-[82vh] w-[92vw]"
                onClick={(e) => e.stopPropagation()}
              >
                <Image src={images[open].src} alt="" fill sizes="92vw" className="object-contain" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-6 text-sm text-ivory/80" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => step(-1)} className="h-12 w-12 rounded-full border border-ivory/20 hover:border-gold" aria-label="Previous">
                ←
              </button>
              <span className="font-display text-lg tabular-nums">
                {open + 1} / {images.length}
              </span>
              <button onClick={() => step(1)} className="h-12 w-12 rounded-full border border-ivory/20 hover:border-gold" aria-label="Next">
                →
              </button>
            </div>
            <button onClick={close} className="absolute right-6 top-6 h-12 w-12 rounded-full border border-ivory/20 text-xl hover:border-gold" aria-label="Close">
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
