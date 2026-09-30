import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseQrPayload, qrDataUrl } from "@/lib/tickets";
import TicketCard from "@/components/events/TicketCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ticket", robots: { index: false } };

/** Public ticket link (from the email). Requires the signature so codes can't be enumerated. */
export default async function TicketPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ s?: string }> }) {
  const { code } = await params;
  const { s } = await searchParams;
  if (!s || parseQrPayload(`/t/${code}?s=${s}`) !== code) notFound();

  const t = await prisma.ticket.findUnique({ where: { code }, include: { booking: { include: { event: true } }, ticketType: true } });
  if (!t || t.booking.status !== "PAID") notFound();

  return (
    <section className="flex min-h-screen items-center justify-center px-5 pb-20 pt-32">
      <TicketCard
        t={{
          code: t.code,
          qr: await qrDataUrl(t.code),
          seatLabel: t.seatLabel,
          type: t.ticketType.name,
          name: t.booking.attendeeName,
          checkedInAt: t.checkedInAt,
          event: t.booking.event,
        }}
      />
    </section>
  );
}
