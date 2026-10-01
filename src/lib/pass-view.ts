import { prisma } from "./prisma";
import { passQrDataUrl, passSig, passUrl, qrDataUrl, ticketUrl } from "./tickets";
import { appleWalletEnabled, googleWalletEnabled } from "./wallet";
import type { TicketView } from "@/components/events/TicketCard";

/** Everything the ticket pages need for one booking: the group pass, single tickets, and save/share links. */
export async function loadPassView(bookingId: string) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { event: true, ticketType: true, tickets: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
  });
  if (!b) return null;

  const entered = b.tickets.filter((t) => t.checkedInAt).length;
  const s = passSig(b.id);
  const pass: TicketView = {
    code: `PASS-${b.id.slice(-8).toUpperCase()}`,
    qr: await passQrDataUrl(b.id),
    seatLabel: null,
    type: b.ticketType.name,
    name: b.attendeeName,
    checkedInAt: entered >= b.tickets.length && b.tickets.length > 0 ? b.tickets[b.tickets.length - 1].checkedInAt : null,
    event: b.event,
    admits: b.tickets.length,
    entered,
  };
  const singles: (TicketView & { url: string })[] = await Promise.all(
    b.tickets.map(async (t) => ({
      code: t.code,
      qr: await qrDataUrl(t.code),
      seatLabel: t.seatLabel,
      type: b.ticketType.name,
      name: b.attendeeName,
      checkedInAt: t.checkedInAt,
      event: b.event,
      url: ticketUrl(t.code),
    }))
  );

  const q = `?s=${s}`;
  return {
    booking: b,
    pass,
    singles,
    links: {
      share: passUrl(b.id),
      ics: `/api/tickets/${b.id}/calendar${q}`,
      google: googleWalletEnabled() ? `/api/tickets/${b.id}/google-wallet${q}` : null,
      apple: appleWalletEnabled() ? `/api/tickets/${b.id}/apple-wallet${q}` : null,
    },
  };
}

export type PassView = NonNullable<Awaited<ReturnType<typeof loadPassView>>>;
