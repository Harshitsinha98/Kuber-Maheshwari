"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard", admin: true },
  { href: "/admin/events", label: "Events & Tickets", admin: true },
  { href: "/admin/bookings", label: "Bookings", admin: true },
  { href: "/admin/scan", label: "Scan Tickets", admin: false },
  { href: "/admin/enquiries", label: "Enquiries", admin: true },
  { href: "/admin/gallery", label: "Gallery", admin: true },
  { href: "/admin/videos", label: "Videos", admin: true },
  { href: "/admin/testimonials", label: "Testimonials", admin: true },
  { href: "/admin/email", label: "Email", admin: true },
  { href: "/admin/social", label: "Social Feeds", admin: true },
];

export default function AdminNav({ role }: { role: string }) {
  const path = usePathname();
  return (
    <nav className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
      {items
        .filter((i) => role === "ADMIN" || !i.admin)
        .map((i) => {
          const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
          return (
            <Link key={i.href} href={i.href} className={`whitespace-nowrap rounded-full px-4 py-1.5 ${active ? "bg-ink text-ivory" : "text-ink/70 hover:bg-[#efe5d2]"}`}>
              {i.label}
            </Link>
          );
        })}
    </nav>
  );
}
