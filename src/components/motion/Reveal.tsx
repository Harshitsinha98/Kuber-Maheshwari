"use client";

import { motion, useInView, useMotionValue, useScroll, useSpring, useTransform, animate } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 40,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.1, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Masked word-by-word rise. Splits on words (safe for Devanagari conjuncts). */
export function SplitText({
  text,
  className,
  delay = 0,
  stagger = 0.06,
  as: Tag = "span",
  immediate = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  immediate?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const show = immediate || inView;
  const words = text.split(" ");
  const MotionTag = motion[Tag];
  return (
    <MotionTag ref={ref as never} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span
          key={i}
          className={`inline-block overflow-hidden align-bottom ${/[\u0900-\u097F]/.test(w) ? "-mx-[0.12em] -my-[0.45em] px-[0.12em] py-[0.45em]" : "-my-[0.2em] py-[0.2em]"}`}
          aria-hidden
        >
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: "200%", rotate: 4, opacity: 0 }}
            animate={show ? { y: "0%", rotate: 0, opacity: 1 } : undefined}
            transition={{ duration: 1.1, ease, delay: delay + i * stagger }}
          >
            {w}
            {i < words.length - 1 ? "\u00a0" : ""}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

/** Words light up one by one as the paragraph scrolls through the viewport. */
export function ScrollFillText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </Word>
      ))}
    </p>
  );
}

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
}) {
  const opacity = useTransform(progress, (v) => 0.14 + 0.86 * Math.min(1, Math.max(0, (v - range[0]) / (range[1] - range[0]))));
  return (
    <motion.span style={{ opacity }} className="inline">
      {children}{" "}
    </motion.span>
  );
}

/** Image that unveils with a clip-path wipe and drifts with parallax. */
export function ParallaxImage({
  src,
  alt,
  className,
  priority,
  focus = "50% 28%",
  sizes = "(max-width: 768px) 100vw, 50vw",
}: {
  src: string;
  alt: string;
  className?: string;
  /** kept for older call sites; images no longer zoom/drift (that made them blurry) */
  strength?: number;
  priority?: boolean;
  /** CSS object-position: where the face is, so cropping never cuts it */
  focus?: string;
  sizes?: string;
}) {
  return (
    <motion.div
      className={`relative overflow-hidden ${className ?? ""}`}
      initial={{ clipPath: "inset(12% 12% 12% 12%)" }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.4, ease }}
    >
      <Image src={src} alt={alt} fill sizes={sizes} quality={90} className="object-cover" style={{ objectPosition: focus }} priority={priority} />
    </motion.div>
  );
}

export function Counter({ to, suffix = "", className, group = true }: { to: number; suffix?: string; className?: string; group?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, to, { duration: 2.2, ease });
    const unsub = mv.on("change", (v) => {
      if (ref.current) ref.current.textContent = (group ? Math.round(v).toLocaleString("en-IN") : String(Math.round(v))) + suffix;
    });
    return () => {
      c.stop();
      unsub();
    };
  }, [inView, mv, to, suffix, group]);
  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}

export function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 180, damping: 14, mass: 0.2 });
  const y = useSpring(0, { stiffness: 180, damping: 14, mass: 0.2 });
  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className="inline-block"
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
