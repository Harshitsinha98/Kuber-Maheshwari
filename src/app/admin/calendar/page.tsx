import Link from "next/link";
import { monthCells } from "@/lib/calendar-grid";
import { fmtDayKey, istDayKey } from "@/lib/format";
import { adminCalendar } from "@/lib/show-booking";
import { guard } from "../guard";
import { PageTitle, btnGhost } from "../ui";
import AdminCalendar, { type AdminDay } from "./AdminCalendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  await guard("calendar");
  const { m } = await searchParams;
  const today = istDayKey();
  const month = m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? m : today.slice(0, 7);
  const cells = monthCells(month);
  const { days, bookings, events } = await adminCalendar(cells[0].key, cells[cells.length - 1].key);
  const dayMap: Record<string, AdminDay> = Object.fromEntries(days.map((d) => [d.date, { kind: d.kind, note: d.note, bookingId: d.bookingId }]));

  const inMonth = (d: string) => d.slice(0, 7) === month;
  const booked = new Set([...days.filter((d) => d.kind === "BOOKED" && inMonth(d.date)).map((d) => d.date), ...events.filter((e) => inMonth(e.date)).map((e) => e.date)]);
  const blocked = days.filter((d) => d.kind === "BLOCKED" && inMonth(d.date)).length;
  const monthDays = cells.filter((c) => c.inMonth).length;

  return (
    <>
      <PageTitle title="Calendar" hi="कैलेंडर">
        <Link href="/admin/show-bookings" className={btnGhost}>
          Show bookings
        </Link>
        <Link href="/booking#book" target="_blank" className={btnGhost}>
          Public calendar ↗
        </Link>
      </PageTitle>
      <div className="mb-5 grid grid-cols-3 gap-3 text-center">
        {[
          ["Booked", booked.size, "text-kumkum"],
          ["Blocked", blocked, "text-stone-600"],
          ["Free", Math.max(0, monthDays - booked.size - blocked), "text-green-700"],
        ].map(([l, n, c]) => (
          <div key={l as string} className="rounded-2xl border border-[#ecdfc7] bg-white px-3 py-3">
            <p className={`font-display text-3xl ${c}`}>{n}</p>
            <p className="text-xs uppercase tracking-widest text-ink/50">{l} this month</p>
          </div>
        ))}
      </div>
      <AdminCalendar
        month={month}
        today={today}
        days={dayMap}
        bookings={bookings}
        events={events.map((e) => ({ id: e.id, date: e.date, title: e.title }))}
      />
      <p className="mt-4 text-xs text-ink/50">
        Today is {fmtDayKey(today, "en")}. Published programmes from Events & Tickets also count as booked days. A date can only ever hold one booking.
      </p>
    </>
  );
}
