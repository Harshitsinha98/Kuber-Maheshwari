import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { guard } from "./guard";
import SignOutButton from "@/components/site/SignOutButton";
import AdminNav from "./AdminNav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await guard(["ADMIN", "STAFF"]);
  return (
    <div className="min-h-screen bg-[#faf6ee] text-ink">
      <header className="sticky top-0 z-30 border-b border-[#eadfca] bg-[#faf6ee]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Link href="/admin" className="flex items-center gap-3">
            <Image src="/images/brand/km-logo.png" alt="" width={32} height={32} className="rounded-full" />
            <span className="font-hindi text-lg">कुबेर माहेश्वरी</span>
            <span className="rounded bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ivory">Admin</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="hidden text-ink/60 hover:text-ink sm:block">
              View site
            </Link>
            <span className="hidden text-ink/50 md:block">{s.user.email}</span>
            <SignOutButton className="text-sm text-kumkum" />
          </div>
        </div>
        <AdminNav role={s.user.role} />
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
