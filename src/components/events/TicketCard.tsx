/* eslint-disable @next/next/no-img-element */
import { fmtDate, fmtTime } from "@/lib/format";

export type TicketView = {
  code: string;
  qr: string; // data URL
  seatLabel: string | null;
  type: string;
  name: string;
  checkedInAt: Date | null;
  event: { title: string; startsAt: Date; venueName: string; city: string };
};

export default function TicketCard({ t }: { t: TicketView }) {
  const used = Boolean(t.checkedInAt);
  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden bg-ivory text-ink shadow-[0_30px_80px_-30px_rgba(232,130,12,0.5)]">
      <div className="bg-night px-6 py-5 text-ivory">
        <p className="font-hindi text-xs [word-spacing:0.5em] text-gold">कुबेर माहेश्वरी</p>
        <p className="mt-2 font-display text-2xl leading-tight">{t.event.title}</p>
        <p className="mt-1 text-xs text-muted">
          {fmtDate(t.event.startsAt)} · {fmtTime(t.event.startsAt)}
        </p>
        <p className="text-xs text-muted">
          {t.event.venueName}, {t.event.city}
        </p>
      </div>
      {/* perforation */}
      <div className="relative h-0 border-t-2 border-dashed border-ink/15">
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-night" />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-night" />
      </div>
      <div className="relative p-6 text-center">
        <img src={t.qr} alt={`QR code for ticket ${t.code}`} className={`mx-auto h-56 w-56 ${used ? "opacity-20" : ""}`} />
        {used && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-kumkum px-4 py-1 text-2xl font-bold uppercase tracking-widest text-kumkum">
            Used
          </span>
        )}
        <p className="mt-4 font-mono text-lg font-semibold tracking-[0.25em]">{t.code}</p>
        <div className="mt-4 flex justify-between border-t border-ink/10 pt-4 text-left text-xs">
          <div>
            <p className="uppercase tracking-[0.2em] text-ink/50">Name</p>
            <p className="mt-1 font-semibold">{t.name}</p>
          </div>
          <div className="text-right">
            <p className="uppercase tracking-[0.2em] text-ink/50">{t.type}</p>
            <p className="mt-1 font-semibold">Ticket {t.seatLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
