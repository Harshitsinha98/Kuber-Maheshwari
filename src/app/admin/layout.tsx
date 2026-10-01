import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { guard } from "./guard";
import { prisma, safe } from "@/lib/prisma";
import SignOutButton from "@/components/site/SignOutButton";
import AdminNav from "./AdminNav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await guard(["ADMIN", "STAFF"]);
  const isAdmin = s.user.role === "ADMIN";
  const newEnquiries = isAdmin ? await safe(() => prisma.enquiry.count({ where: { handled: false } }), 0) : 0;
  const badges = { "/admin/enquiries": newEnquiries };
  const first = (s.user.name || "").split(" ")[0];

  return (
    <div className="min-h-screen bg-[#f7f1e6] text-ink lg:grid lg:grid-cols-[264px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto bg-gradient-to-b from-[#24131a] via-[#1d1416] to-[#140d0e] px-4 py-6 text-ivory lg:flex">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <Image src="/images/brand/km-logo.png" alt="" width={40} height={40} className="rounded-full ring-2 ring-gold/40" />
          <span className="leading-tight">
            <span className="block font-display text-xl leading-snug">Kuber Maheshwari</span>
            <span className="block text-[10px] uppercase tracking-[0.3em] text-gold">Admin panel</span>
          </span>
        </Link>
        <div className="mt-8 flex-1">
          <AdminNav role={s.user.role} badges={badges} />
        </div>
        <div className="mt-6 rounded-2xl bg-white/5 p-3">
          <div className="flex items-center gap-3">
            {s.user.image ? (
              <Image src={s.user.image} alt="" width={36} height={36} className="rounded-full" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron font-semibold text-night">{(first || "A").charAt(0)}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{s.user.name || "Admin"}</p>
              <p className="truncate text-[11px] text-ivory/45">{s.user.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <Link href="/" target="_blank" className="text-ivory/60 hover:text-gold">
              View website
            </Link>
            <SignOutButton className="text-xs text-marigold hover:underline" />
          </div>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 bg-[#1d1416] text-ivory lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/images/brand/km-logo.png" alt="" width={30} height={30} className="rounded-full" />
            <span className="font-display text-lg">Kuber Maheshwari</span>
            <span className="rounded bg-saffron px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-night">Admin</span>
          </Link>
          <SignOutButton className="text-xs text-marigold" />
        </div>
        <AdminNav role={s.user.role} badges={badges} />
      </header>

      <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
