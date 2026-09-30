"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { site } from "@/lib/site";

const links = [
  { href: "/", label: "Home", hi: "मुख्य", img: "/images/gallery/kuber-04.webp" },
  { href: "/about", label: "About", hi: "परिचय", img: "/images/gallery/kuber-07.webp" },
  { href: "/services", label: "Services", hi: "सेवाएँ", img: "/images/gallery/kuber-06.webp" },
  { href: "/events", label: "Events", hi: "कार्यक्रम", img: "/images/gallery/kuber-01.webp" },
  { href: "/gallery", label: "Gallery", hi: "झलकियाँ", img: "/images/gallery/kuber-15.webp" },
  { href: "/videos", label: "Videos", hi: "वीडियो", img: "/images/gallery/kuber-41.webp" },
  { href: "/booking", label: "Book Kuber Ji", hi: "आमंत्रण", img: "/images/gallery/kuber-30.webp" },
  { href: "/contact", label: "Contact", hi: "संपर्क", img: "/images/gallery/kuber-27.webp" },
];

const ease = [0.83, 0, 0.17, 1] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [preview, setPreview] = useState(links[0].img);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(v > prev && v > 240 && !open);
    setSolid(v > 40);
  });

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const lenis = (window as unknown as { lenis?: { stop(): void; start(): void } }).lenis;
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open]);

  return (
    <>
      <motion.header
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          solid && !open ? "bg-night/70 backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5 md:px-10">
          <Link href="/" className="group flex items-center gap-3" aria-label="Kuber Maheshwari home">
            <Image src="/images/brand/km-logo.png" alt="" width={40} height={40} className="rounded-full" />
            <span className="leading-none">
              <span className="block font-hindi text-lg text-ivory">{site.nameHi}</span>
              <span className="block text-[10px] uppercase tracking-[0.32em] text-muted">Bhajan Singer</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-9 text-[13px] uppercase tracking-[0.18em] text-ivory/80 lg:flex">
            {links.slice(1, 6).map((l) => (
              <Link key={l.href} href={l.href} className="group relative py-2">
                <span className={pathname.startsWith(l.href) ? "text-gold" : "group-hover:text-ivory"}>{l.label}</span>
                <span className="absolute bottom-0 left-0 h-px w-full origin-right scale-x-0 bg-gold transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={session ? "/my-tickets" : "/login"}
              className="hidden text-[12px] uppercase tracking-[0.18em] text-ivory/70 hover:text-gold md:block"
            >
              {session ? "My Tickets" : "Sign in"}
            </Link>
            <Link
              href="/booking"
              className="hidden rounded-full border border-gold/50 px-5 py-2.5 text-[12px] uppercase tracking-[0.18em] text-gold transition-colors hover:bg-gold hover:text-night sm:block"
            >
              Book Now
            </Link>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-ivory/5 ring-1 ring-ivory/15 backdrop-blur"
            >
              <motion.span animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }} className="absolute h-px w-5 bg-ivory" />
              <motion.span animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }} className="absolute h-px w-5 bg-ivory" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-night"
            initial={{ clipPath: "circle(0% at calc(100% - 64px) 40px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 64px) 40px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 64px) 40px)" }}
            transition={{ duration: 0.9, ease }}
          >
            <div className="mx-auto grid h-full max-w-[1500px] grid-cols-1 gap-10 px-5 pb-10 pt-28 md:px-10 lg:grid-cols-[1.3fr_1fr]">
              <ul className="flex flex-col justify-center">
                {links.map((l, i) => (
                  <li key={l.href} className="overflow-hidden border-b border-ivory/10">
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.25 + i * 0.05 }}
                    >
                      <Link
                        href={l.href}
                        onMouseEnter={() => setPreview(l.img)}
                        className="group flex items-baseline justify-between py-2.5 md:py-3"
                      >
                        <span className="flex items-baseline gap-4">
                          <span className="font-sans text-xs text-muted">0{i + 1}</span>
                          <span className="font-display text-4xl text-ivory transition-all duration-500 group-hover:translate-x-3 group-hover:italic group-hover:text-gold md:text-6xl">
                            {l.label}
                          </span>
                        </span>
                        <span className="font-hindi text-lg text-muted transition-colors group-hover:text-saffron">{l.hi}</span>
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
              <div className="relative hidden overflow-hidden rounded-[2px] lg:block">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={preview}
                    initial={{ opacity: 0, scale: 1.15 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                  >
                    <Image src={preview} alt="" fill sizes="40vw" className="object-cover" />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex justify-between text-sm text-ivory/80">
                  {site.phones.map((p) => (
                    <a key={p.tel} href={`tel:${p.tel}`} className="hover:text-gold">
                      {p.display}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
