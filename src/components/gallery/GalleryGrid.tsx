"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { GalleryImage } from "@/lib/queries";

const LAYOUTS = [
  { cols: 2, className: "flex md:hidden" },
  { cols: 3, className: "hidden md:flex xl:hidden" },
  { cols: 4, className: "hidden xl:flex" },
];

/** Deal photo indexes into columns row by row: 0,1,2,3 on the first row, and so on. */
const spread = (n: number, cols: number) =>
  Array.from({ length: cols }, (_, c) => Array.from({ length: Math.ceil((n - c) / cols) }, (_, r) => r * cols + c));

function Tile({ img, i, onOpen }: { img: GalleryImage; i: number; onOpen: (i: number) => void }) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(i)}
      data-cursor="View"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: (i % 4) * 0.06 }}
      className="group relative block w-full overflow-hidden"
    >
      <Image
        src={img.src}
        alt={img.caption || "Kuber Maheshwari"}
        width={img.width}
        height={img.height}
        sizes="(max-width:768px) 50vw, (max-width:1280px) 33vw, 25vw"
        {...(img.blur ? { placeholder: "blur" as const, blurDataURL: img.blur } : {})}
        className="h-auto w-full transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="absolute bottom-3 left-3 translate-y-2 text-[10px] uppercase tracking-[0.3em] text-ivory opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        {img.caption || "View"} ↗
      </span>
    </motion.button>
  );
}

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
      {/* One layout per breakpoint so photos fill left-to-right in gallery order
          (CSS columns would stack consecutive, similar photos in one column).
          Hidden layouts cost nothing: lazy images inside display:none never load. */}
      {LAYOUTS.map((l) => (
        <div key={l.cols} className={`${l.className} gap-3 md:gap-5`}>
          {spread(images.length, l.cols).map((col, c) => (
            <div key={c} className="flex min-w-0 flex-1 flex-col gap-3 md:gap-5">
              {col.map((i) => (
                <Tile key={images[i].src} img={images[i]} i={i} onOpen={setOpen} />
              ))}
            </div>
          ))}
        </div>
      ))}

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
                className="relative h-[78vh] w-[94vw] touch-pan-y md:h-[82vh] md:w-[92vw]"
                onClick={(e) => e.stopPropagation()}
                // Swipe left/right on phones.
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.35}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -70 || info.velocity.x < -400) step(1);
                  else if (info.offset.x > 70 || info.velocity.x > 400) step(-1);
                }}
              >
                <Image
                  src={images[open].src}
                  alt={images[open].caption || "Kuber Maheshwari"}
                  fill
                  quality={90}
                  sizes="94vw"
                  draggable={false}
                  {...(images[open].blur ? { placeholder: "blur" as const, blurDataURL: images[open].blur } : {})}
                  className="pointer-events-none select-none object-contain"
                />
              </motion.div>
            </AnimatePresence>
            {/* Warm the next/previous photos so arrows feel instant. */}
            <div className="hidden" aria-hidden>
              {[1, -1].map((d) => {
                const n = images[(open + d + images.length) % images.length];
                return <Image key={n.src + d} src={n.src} alt="" width={n.width} height={n.height} quality={90} sizes="94vw" loading="eager" />;
              })}
            </div>
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
