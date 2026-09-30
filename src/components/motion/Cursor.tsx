"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * A soft gold cursor ring. Elements with data-cursor="Label" make it grow and show the label.
 * Only on devices with a fine pointer (desktop).
 */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button, [role=button], input, textarea, select");
      setLabel(el?.dataset.cursor || null);
      setHover(Boolean(el));
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);

  if (!enabled) return null;
  const size = label ? 96 : hover ? 44 : 14;
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none fixed left-0 top-0 z-[70] ${label ? "" : "mix-blend-difference"}`}
      style={{ x: sx, y: sy }}
    >
      <motion.div
        className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
        animate={{
          width: size,
          height: size,
          backgroundColor: label ? "rgba(232,130,12,1)" : hover ? "rgba(246,238,223,0)" : "rgba(246,238,223,1)",
          borderWidth: hover && !label ? 1 : 0,
        }}
        style={{ borderColor: "#f6eedf", borderStyle: "solid" }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <AnimatePresence>
          {label && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
