import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma, safe } from "@/lib/prisma";
import { ensureBookingTables } from "@/lib/booking-tables";
import { fmtDate, fmtDayKey, fmtTime, inr, istDayKey, rupees } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";
import SignOutButton from "@/components/site/SignOutButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My account", robots: { index: false } };

const showStatus: Record<string, [string, string]> = {
  CONFIRMED: ["पक्की · Confirmed", "text-emerald-300 border-emerald-300/40"],
  REQUESTED: ["अनुरोध · Awaiting confirmation", "text-gold border-gold/40"],
  PENDING: ["भुगतान बाकी · Payment pending", "text-gold border-gold/40"],
  CONFLICT: ["टीम संपर्क करेगी · We will call you", "text-marigold border-marigold/40"],
  FAILED: ["भुगतान नहीं हुआ · Not paid", "text-ivory/50 border-ivory/20"],
  CANCELLED: ["रद्द · Cancelled", "text-ivory/50 border-ivory/20"],
};

export default async function MyTickets() {
  const s = await getSession();
  if (!s) redirect("/login?callbackUrl=/my-tickets");
  const shows = await safe(async () => {
    await ensureBookingTables();
    return prisma.showBooking.findMany({
      where: { userId: s.user.id, status: { in: ["CONFIRMED", "REQUESTED", "PENDING", "CONFLICT", "CANCELLED"] } },
      orderBy: { date: "desc" },
    });
  }, []);
  const today = istDayKey();
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
            My <span className="italic text-gold">account</span>
          </h1>
          <p className="mt-2 text-sm text-muted">{s.user.email}</p>
        </div>
        <div className="flex items-center gap-4">
          {(s.user.perms ?? []).length > 0 && (
            <Link href="/admin" className="rounded-full border border-gold/50 px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-gold">
              Admin panel
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>

      {/* ---------- Programme bookings (Kuber ji booked for a date) ---------- */}
      <div className="mt-16 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-hindi text-3xl leading-[1.4] text-ivory">मेरी बुकिंग · My bookings</h2>
        <Link href="/booking#book" className="text-xs uppercase tracking-[0.18em] text-gold hover:underline">
          + New booking
        </Link>
      </div>
      {shows.length === 0 ? (
        <div className="mt-6 border-y border-ivory/10 py-12 text-center">
          <p className="font-display text-2xl italic text-ivory/70">No programme bookings yet.</p>
          <Link href="/booking#book" className="mt-5 inline-flex h-12 items-center rounded-full bg-saffron px-7 text-xs font-semibold uppercase tracking-[0.18em] text-night">
            Book Kuber ji
          </Link>
        </div>
      ) : (
        <ul className="mt-6 border-t border-ivory/10">
          {shows.map((b, i) => {
            const [label, tone] = showStatus[b.status] ?? [b.status, "text-ivory/60 border-ivory/20"];
            return (
              <Reveal key={b.id} delay={i * 0.05}>
                <li className="border-b border-ivory/10">
                  <Link href={`/booking/${b.id}`} className={`group flex flex-wrap items-center justify-between gap-4 py-7 ${b.date < today ? "opacity-60" : ""}`}>
                    <div>
                      <p className="font-hindi text-2xl leading-[1.5] transition-colors group-hover:text-gold">{b.serviceName}</p>
                      <p className="mt-1 text-sm text-muted">
                        {fmtDayKey(b.date)} · {b.locationName} · {b.ref}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <span className={`inline-block rounded-full border px-3 py-1 font-hindi text-xs ${tone}`}>{label}</span>
                      <p className="mt-2 text-muted">
                        {inr(b.paidAmount)} paid of {inr(b.total)}
                      </p>
                    </div>
                  </Link>
                </li>
              </Reveal>
            );
          })}
        </ul>
      )}

      {/* ---------- Event tickets ---------- */}
      <h2 className="mt-20 font-hindi text-3xl leading-[1.4] text-ivory">मेरे टिकट · My tickets</h2>
      {bookings.length === 0 ? (
        <div className="mt-6 border-y border-ivory/10 py-16 text-center">
          <p className="font-display text-3xl italic text-ivory/80">No tickets yet.</p>
          <Link href="/events" className="mt-6 inline-flex h-12 items-center rounded-full bg-saffron px-7 text-xs font-semibold uppercase tracking-[0.18em] text-night">
            Browse events
          </Link>
        </div>
      ) : (
        <ul className="mt-6 border-t border-ivory/10">
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
