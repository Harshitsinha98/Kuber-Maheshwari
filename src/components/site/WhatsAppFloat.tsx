"use client";

import { motion } from "framer-motion";
import { waLink } from "@/lib/site";
import { WhatsappIcon } from "./Icons";

export default function WhatsAppFloat() {
  return (
    <motion.a
      href={waLink()}
      target="_blank"
      rel="noopener"
      aria-label="Chat on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 3, type: "spring", stiffness: 200, damping: 16 }}
      className="group fixed bottom-5 right-5 z-30 flex print:hidden h-14 w-14 items-center justify-center rounded-full bg-[#1f9d55] text-white shadow-[0_10px_40px_-8px_rgba(31,157,85,0.7)] md:bottom-8 md:right-8"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#1f9d55]/40 [animation-duration:2.5s]" />
      <WhatsappIcon className="relative h-7 w-7" />
    </motion.a>
  );
}
