import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { verifyPassSig } from "@/lib/tickets";
import { loadPassView } from "@/lib/pass-view";
import BookingTickets from "@/components/events/BookingTickets";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your ticket", robots: { index: false } };

/** Shareable pass link (email / WhatsApp). The signature in ?s= stops anyone guessing other bookings. */
export default async function PassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ s?: string }> }) {
  const { id } = await params;
  const { s } = await searchParams;
  if (!verifyPassSig(id, s)) notFound();
  const v = await loadPassView(id);
  if (!v || v.booking.status !== "PAID" || v.singles.length === 0) notFound();
  return (
    <section className="mx-auto max-w-[1500px] px-5 pb-32 pt-36 md:px-10">
      <p className="text-xs uppercase tracking-[0.35em] text-gold">Ticket · {v.booking.event.title}</p>
      <div className="mt-10">
        <BookingTickets v={v} />
      </div>
    </section>
  );
}
