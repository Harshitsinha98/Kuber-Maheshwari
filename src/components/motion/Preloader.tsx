"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/** Short (≈2s) intro shown once per browser session. */
export default function Preloader() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("km-intro")) return;
    sessionStorage.setItem("km-intro", "1");
    setShow(true);
    document.documentElement.style.overflow = "hidden";
    const t = setTimeout(() => {
      setShow(false);
      document.documentElement.style.overflow = "";
    }, 2300);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-night"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 1.1, ease: [0.83, 0, 0.17, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, wordSpacing: "1.2em" }}
            animate={{ opacity: 1, wordSpacing: "0.5em" }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-hindi text-sm text-gold"
          >
            ॥ जय श्री राम ॥
          </motion.div>
          <div className="mt-6 overflow-hidden px-2 py-[0.35em]">
            <motion.div
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="font-hindi text-5xl leading-[1.45] text-ivory md:text-7xl"
            >
              कुबेर माहेश्वरी
            </motion.div>
          </div>
          <motion.div
            className="mt-8 h-px w-48 origin-left bg-gold/70"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.6, delay: 0.3, ease: [0.83, 0, 0.17, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
