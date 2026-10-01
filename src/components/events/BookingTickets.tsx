import { fmtDate, fmtTime } from "@/lib/format";
import type { PassView } from "@/lib/pass-view";
import TicketCard from "./TicketCard";
import TicketActions from "./TicketActions";

/** Group pass (one QR) + save/share actions + optional separate QRs. Used by the booking page and the shared pass link. */
export default function BookingTickets({ v }: { v: PassView }) {
  const { booking: b, pass, singles, links } = v;
  const many = singles.length > 1;
  return (
    <div>
      <div className="grid items-start gap-10 lg:grid-cols-[380px_1fr]">
        <TicketCard t={pass} />
        <div className="space-y-6">
          <div className="text-ivory/75">
            {many ? (
              <>
                <p className="text-lg text-ivory">One QR for all {singles.length} people.</p>
                <p className="mt-2 text-sm">
                  At the gate the staff choose how many of you are entering, so you can come together or a few at a time. Each ticket can enter only once.
                </p>
              </>
            ) : (
              <p className="text-lg text-ivory">Show this QR at the gate. It admits one person, once.</p>
            )}
          </div>
          <TicketActions
            title={b.event.title}
            dateLine={`${fmtDate(b.event.startsAt)} · ${fmtTime(b.event.startsAt)}`}
            venueLine={`${b.event.venueName}, ${b.event.address}, ${b.event.city}`}
            name={b.attendeeName}
            type={b.ticketType.name}
            admits={singles.length}
            qr={pass.qr}
            links={links}
          />
        </div>
      </div>

      {many && (
        <details className="group mt-16 border-t border-ivory/10 pt-8 print:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm uppercase tracking-[0.2em] text-gold">
            <span>Need separate QRs? ({singles.length})</span>
            <span className="transition-transform group-open:rotate-45">＋</span>
          </summary>
          <p className="mt-4 max-w-2xl text-sm text-muted">
            For people arriving separately: send each person their own QR. These are the same {singles.length} tickets, so a ticket used with one QR can&apos;t be used again with
            the other.
          </p>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {singles.map((t) => (
              <div key={t.code}>
                <TicketCard t={t} compact />
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`🎟️ ${b.event.title} · Ticket ${t.seatLabel}\n${t.url}`)}`}
                  target="_blank"
                  rel="noopener"
                  className="mx-auto mt-3 flex max-w-sm items-center justify-center rounded-full border border-ivory/15 py-2.5 text-xs uppercase tracking-[0.16em] text-ivory/80 hover:border-gold hover:text-gold"
                >
                  Send ticket {t.seatLabel} on WhatsApp
                </a>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
