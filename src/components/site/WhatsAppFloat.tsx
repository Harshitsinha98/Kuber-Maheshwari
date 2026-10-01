"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site, waLink } from "@/lib/site";
import { WhatsappIcon } from "./Icons";

/**
 * Desktop: floating WhatsApp button.
 * Mobile: a bottom action bar (Call · WhatsApp · Book), the three things visitors come for.
 * Event pages show their own "book tickets" bar instead.
 */
export default function WhatsAppFloat() {
  const path = usePathname();
  const onEvent = /^\/events\/[^/]+$/.test(path);
  return (
    <>
      <motion.a
        href={waLink()}
        target="_blank"
        rel="noopener"
        aria-label="Chat on WhatsApp"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 3, type: "spring", stiffness: 200, damping: 16 }}
        className="group fixed bottom-8 right-8 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-[#1f9d55] text-white shadow-[0_10px_40px_-8px_rgba(31,157,85,0.7)] print:hidden md:flex"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-[#1f9d55]/40 [animation-duration:2.5s]" />
        <WhatsappIcon className="relative h-7 w-7" />
      </motion.a>

      {!onEvent && (
        <motion.nav
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ delay: 1.5, type: "spring", stiffness: 160, damping: 20 }}
          aria-label="Quick actions"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-2 border-t border-gold/20 bg-night/90 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 backdrop-blur-xl print:hidden md:hidden"
        >
          <a href={`tel:${site.phones[0].tel}`} className="flex h-12 items-center justify-center gap-2 rounded-full border border-ivory/20 font-hindi text-base text-ivory">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z" />
            </svg>
            कॉल
          </a>
          <a href={waLink()} target="_blank" rel="noopener" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#1f9d55] font-hindi text-base text-white">
            <WhatsappIcon className="h-5 w-5" /> व्हाट्सऐप
          </a>
          <Link href="/booking" className="flex h-12 items-center justify-center rounded-full bg-saffron font-hindi text-base font-semibold text-night">
            बुक करें
          </Link>
        </motion.nav>
      )}
    </>
  );
}
