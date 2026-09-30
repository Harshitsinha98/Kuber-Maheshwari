import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { qrDataUrl } from "@/lib/tickets";
import { rupees } from "@/lib/format";
import TicketCard from "@/components/events/TicketCard";
import { Reveal, SplitText } from "@/components/motion/Reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your booking", robots: { index: false } };

export default async function BookingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const s = await getSession();
  if (!s) redirect(`/login?callbackUrl=/bookings/${id}`);

  const b = await prisma.booking.findUnique({
    where: { id },
    include: { event: true, ticketType: true, tickets: { orderBy: { seatLabel: "asc" } } },
  });
  if (!b || (b.userId !== s.user.id && s.user.role !== "ADMIN")) notFound();

  const tickets = await Promise.all(
    b.tickets.map(async (t) => ({
      code: t.code,
      qr: await qrDataUrl(t.code),
      seatLabel: t.seatLabel,
      type: b.ticketType.name,
      name: b.attendeeName,
      checkedInAt: t.checkedInAt,
      event: b.event,
    }))
  );

  return (
    <section className="mx-auto max-w-[1500px] px-5 pb-32 pt-36 md:px-10">
      {b.status === "PAID" ? (
        <>
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Booking {b.id.slice(-8).toUpperCase()}</p>
          <SplitText as="h1" immediate text={isNew ? "जय श्री राम! You're in." : "Your tickets"} className="mt-5 block font-display text-5xl md:text-7xl" />
          <Reveal delay={0.2}>
            <p className="mt-5 max-w-2xl text-lg text-ivory/70">
              {b.quantity} × {b.ticketType.name} · {rupees(b.amount)}. A copy has been emailed to <span className="text-ivory">{b.attendeeEmail}</span>. Show each QR at the gate. Each QR admits one person, once.
            </p>
          </Reveal>
          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {tickets.map((t, i) => (
              <Reveal key={t.code} delay={i * 0.1}>
                <TicketCard t={t} />
              </Reveal>
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-xl">
          <h1 className="font-display text-5xl">{b.status === "PENDING" ? "Payment pending" : "Payment not completed"}</h1>
          <p className="mt-5 text-ivory/70">
            {b.status === "PENDING"
              ? "We're waiting for confirmation from the payment gateway. If money was deducted, your tickets will appear here automatically within a few minutes."
              : "This booking was not paid. No tickets were issued."}
          </p>
          <Link href={`/events/${b.event.slug}`} className="mt-8 inline-flex h-12 items-center rounded-full bg-saffron px-7 text-xs font-semibold uppercase tracking-[0.18em] text-night">
            Back to event
          </Link>
        </div>
      )}
    </section>
  );
}
