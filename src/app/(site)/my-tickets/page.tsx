import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate, fmtTime, rupees } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";
import SignOutButton from "@/components/site/SignOutButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My tickets", robots: { index: false } };

export default async function MyTickets() {
  const s = await getSession();
  if (!s) redirect("/login?callbackUrl=/my-tickets");
  const bookings = await prisma.booking.findMany({
    where: { userId: s.user.id, status: "PAID" },
    include: { event: true, ticketType: true, _count: { select: { tickets: true } } },
    orderBy: { event: { startsAt: "desc" } },
  });

  return (
    <section className="mx-auto max-w-[1100px] px-5 pb-32 pt-36 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Namaste, {s.user.name?.split(" ")[0]}</p>
          <h1 className="mt-4 font-display text-6xl md:text-7xl">
            My <span className="italic text-gold">tickets</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {(s.user.role === "ADMIN" || s.user.role === "STAFF") && (
            <Link href={s.user.role === "ADMIN" ? "/admin" : "/admin/scan"} className="rounded-full border border-gold/50 px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-gold">
              {s.user.role === "ADMIN" ? "Admin panel" : "Scan tickets"}
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-16 border-y border-ivory/10 py-16 text-center">
          <p className="font-display text-3xl italic text-ivory/80">No tickets yet.</p>
          <Link href="/events" className="mt-6 inline-flex h-12 items-center rounded-full bg-saffron px-7 text-xs font-semibold uppercase tracking-[0.18em] text-night">
            Browse events
          </Link>
        </div>
      ) : (
        <ul className="mt-16 border-t border-ivory/10">
          {bookings.map((b, i) => (
            <Reveal key={b.id} delay={i * 0.05}>
              <li className="border-b border-ivory/10">
                <Link href={`/bookings/${b.id}`} className="group flex flex-wrap items-center justify-between gap-4 py-7">
                  <div>
                    <p className="font-display text-3xl transition-all group-hover:italic group-hover:text-gold">{b.event.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {fmtDate(b.event.startsAt)} · {fmtTime(b.event.startsAt)} · {b.event.venueName}, {b.event.city}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>
                      {b._count.tickets} × {b.ticketType.name}
                    </p>
                    <p className="text-muted">{rupees(b.amount)}</p>
                  </div>
                </Link>
              </li>
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}
