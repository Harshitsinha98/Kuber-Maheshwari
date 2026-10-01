"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const I = {
  home: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  events: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  bookings: "M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4zM9 7v12",
  scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16",
  enquiries: "M4 5h16v11H8l-4 4z",
  gallery: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M9 9.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z",
  videos: "M4 6h12v12H4zM16 10l4-2v8l-4-2",
  quote: "M7 7h4v4c0 3-2 5-4 6M15 7h4v4c0 3-2 5-4 6",
  email: "M4 6h16v12H4zM4 7l8 6 8-6",
  whatsapp: "M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z",
  social: "M6 12a2.5 2.5 0 1 0 0 .01M18 6a2.5 2.5 0 1 0 0 .01M18 18a2.5 2.5 0 1 0 0 .01M8.3 11 15.7 7M8.3 13l7.4 4",
};

type Item = { href: string; label: string; icon: keyof typeof I; admin: boolean };
const groups: { title: string; items: Item[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: "home", admin: true }],
  },
  {
    title: "Events",
    items: [
      { href: "/admin/events", label: "Events & Tickets", icon: "events", admin: true },
      { href: "/admin/bookings", label: "Bookings", icon: "bookings", admin: true },
      { href: "/admin/scan", label: "Scan Tickets", icon: "scan", admin: false },
      { href: "/admin/enquiries", label: "Enquiries", icon: "enquiries", admin: true },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/gallery", label: "Gallery", icon: "gallery", admin: true },
      { href: "/admin/videos", label: "Videos", icon: "videos", admin: true },
      { href: "/admin/testimonials", label: "Testimonials", icon: "quote", admin: true },
      { href: "/admin/social", label: "Social Feeds", icon: "social", admin: true },
    ],
  },
  {
    title: "Notifications",
    items: [
      { href: "/admin/whatsapp", label: "WhatsApp", icon: "whatsapp", admin: true },
      { href: "/admin/email", label: "Email", icon: "email", admin: true },
    ],
  },
];

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
}

/** Desktop: grouped sidebar. Mobile: horizontal scroll pills. */
export default function AdminNav({ role, badges = {} }: { role: string; badges?: Record<string, number> }) {
  const active = useActive();
  const visible = groups.map((g) => ({ ...g, items: g.items.filter((i) => role === "ADMIN" || !i.admin) })).filter((g) => g.items.length);
  return (
    <>
      <nav className="hidden space-y-6 lg:block" aria-label="Admin">
        {visible.map((g) => (
          <div key={g.title}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-ivory/35">{g.title}</p>
            <ul className="mt-2 space-y-0.5">
              {g.items.map((i) => {
                const on = active(i.href);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        on ? "bg-saffron text-night shadow-[0_8px_24px_-10px_rgba(232,130,12,0.9)]" : "text-ivory/75 hover:bg-white/5 hover:text-ivory"
                      }`}
                    >
                      <Icon d={I[i.icon]} />
                      <span className="flex-1">{i.label}</span>
                      {badges[i.href] ? (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${on ? "bg-night/15" : "bg-kumkum text-ivory"}`}>{badges[i.href]}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3 lg:hidden" aria-label="Admin">
        {visible
          .flatMap((g) => g.items)
          .map((i) => {
            const on = active(i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm ${on ? "bg-saffron text-night" : "bg-white/5 text-ivory/80"}`}
              >
                <Icon d={I[i.icon]} />
                {i.label}
                {badges[i.href] ? <span className="rounded-full bg-kumkum px-1.5 text-[11px] text-ivory">{badges[i.href]}</span> : null}
              </Link>
            );
          })}
      </nav>
    </>
  );
}
