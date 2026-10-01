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
  /** group pass: how many people this one QR admits, and how many already entered */
  admits?: number;
  entered?: number;
};

export default function TicketCard({ t, compact = false }: { t: TicketView; compact?: boolean }) {
  const group = (t.admits || 1) > 1;
  const used = group ? (t.entered || 0) >= (t.admits || 1) : Boolean(t.checkedInAt);
  const partly = group && !used && (t.entered || 0) > 0;
  return (
    <div
      data-ticket-card
      className="relative mx-auto w-full max-w-sm overflow-hidden bg-ivory text-ink shadow-[0_30px_80px_-30px_rgba(232,130,12,0.5)] print:shadow-none"
    >
      <div className="bg-night px-6 py-5 text-ivory">
        <div className="flex items-start justify-between gap-3">
          <p className="font-hindi text-sm leading-relaxed text-gold [word-spacing:0.4em]">कुबेर माहेश्वरी</p>
          {group && (
            <span className="shrink-0 rounded-full bg-saffron px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-night">Admits {t.admits}</span>
          )}
        </div>
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
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-night print:hidden" />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-night print:hidden" />
      </div>
      <div className="relative p-6 text-center">
        <img src={t.qr} alt={`QR code ${t.code}`} className={`mx-auto ${compact ? "h-44 w-44" : "h-60 w-60"} ${used ? "opacity-20" : ""}`} />
        {used && (
          <span className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-kumkum px-4 py-1 text-2xl font-bold uppercase tracking-widest text-kumkum">
            Used
          </span>
        )}
        {group ? (
          <p className="mt-4 text-sm font-semibold">
            One QR for all {t.admits} people
            {partly && <span className="mt-1 block text-xs font-normal text-ink/60">{t.entered} entered · {(t.admits || 0) - (t.entered || 0)} can still enter</span>}
          </p>
        ) : (
          <p className="mt-4 font-mono text-lg font-semibold tracking-[0.25em]">{t.code}</p>
        )}
        <div className="mt-4 flex justify-between border-t border-ink/10 pt-4 text-left text-xs">
          <div>
            <p className="uppercase tracking-[0.2em] text-ink/50">Name</p>
            <p className="mt-1 font-semibold">{t.name}</p>
          </div>
          <div className="text-right">
            <p className="uppercase tracking-[0.2em] text-ink/50">{t.type}</p>
            <p className="mt-1 font-semibold">{group ? `${t.admits} tickets` : `Ticket ${t.seatLabel}`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
