import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtTime, inr, rupees, toLocalIST } from "@/lib/format";
import { remainingSeats } from "@/lib/tickets";
import { guard } from "../../guard";
import { Badge, Card, PageTitle, btnGhost } from "../../ui";
import EventForm from "../EventForm";
import { deleteEvent, manualCheckIn, resendTickets } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await guard();
  const { id } = await params;
  const { saved } = await searchParams;
  const e = await prisma.event.findUnique({
    where: { id },
    include: {
      ticketTypes: { orderBy: { sortOrder: "asc" } },
      bookings: { where: { status: "PAID" }, include: { tickets: true, ticketType: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!e) notFound();

  const tickets = e.bookings.flatMap((b) => b.tickets.map((t) => ({ ...t, b })));
  const checked = tickets.filter((t) => t.checkedInAt).length;
  const revenue = e.bookings.reduce((a, b) => a + b.amount, 0);
  const left = await Promise.all(e.ticketTypes.map(async (t) => ({ t, left: await remainingSeats(t.id) })));

  return (
    <>
      <PageTitle title={e.title}>
        <Link href={`/events/${e.slug}`} target="_blank" className={btnGhost}>
          View page ↗
        </Link>
        <Link href={`/admin/scan?event=${e.id}`} className={btnGhost}>
          Scan for this event
        </Link>
        <a href={`/admin/events/${e.id}/export`} className={btnGhost}>
          Export CSV
        </a>
      </PageTitle>
      {saved && <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Saved ✓</p>}
      {e.status === "DRAFT" && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <b>This event is a Draft and is hidden from the website.</b> To show it, change <b>Status → Published</b> below and click Save changes.
        </p>
      )}
      {e.status === "PUBLISHED" && e.startsAt.getTime() < Date.now() - 6 * 3600e3 && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <b>This event&apos;s date has passed</b>, so it shows under Past events and bookings are closed. Check the start date/time.
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-widest text-ink/50">Tickets sold</p>
          <p className="mt-1 font-display text-3xl">{tickets.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-ink/50">Checked in</p>
          <p className="mt-1 font-display text-3xl">
            {checked} <span className="text-base text-ink/50">/ {tickets.length}</span>
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-ink/50">Revenue</p>
          <p className="mt-1 font-display text-3xl">{inr(revenue)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-ink/50">Price · Seats left</p>
          <div className="mt-1 space-y-0.5 text-sm">
            {left.map(({ t, left }) => (
              <div key={t.id} className="flex justify-between gap-2">
                <span>
                  {t.name} <span className={t.price === 0 ? "text-amber-700" : "text-ink/50"}>· {rupees(t.price)}</span>
                </span>
                <span className="tabular-nums">{left}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <EventForm
            id={e.id}
            d={{
              title: e.title,
              subtitle: e.subtitle || "",
              description: e.description,
              category: e.category,
              startsAt: toLocalIST(e.startsAt),
              endsAt: toLocalIST(e.endsAt),
              gatesOpenAt: toLocalIST(e.gatesOpenAt),
              venueName: e.venueName,
              address: e.address,
              city: e.city,
              mapUrl: e.mapUrl || "",
              posterUrl: e.posterUrl || "",
              status: e.status,
              ticketTypes: e.ticketTypes.map((t) => ({ id: t.id, name: t.name, description: t.description || "", price: t.price / 100, capacity: t.capacity, maxPerOrder: t.maxPerOrder })),
            }}
          />
          {e.bookings.length === 0 && (
            <form action={deleteEvent.bind(null, e.id)} className="mt-6 border-t border-[#f0e6d4] pt-4">
              <button className="text-sm text-kumkum hover:underline">Delete event</button>
            </form>
          )}
        </Card>

        <Card className="overflow-x-auto p-0">
          <h2 className="px-5 pt-5 font-semibold">Attendees</h2>
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-[#f0e6d4]">
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td className="px-5 py-2.5">
                    <div className="font-medium">{t.b.attendeeName}</div>
                    <div className="text-xs text-ink/50">
                      {t.b.attendeePhone} · {t.b.ticketType.name} {t.seatLabel} · <span className="font-mono">{t.code}</span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {t.checkedInAt ? <Badge tone="green">In · {fmtTime(t.checkedInAt)}</Badge> : <Badge tone="gray">Not arrived</Badge>}
                    <form action={manualCheckIn.bind(null, t.id, Boolean(t.checkedInAt))} className="mt-1">
                      <button className="text-xs text-ink/50 hover:text-kumkum">{t.checkedInAt ? "Undo" : "Check in"}</button>
                    </form>
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-center text-ink/50">No tickets sold yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          {e.bookings.length > 0 && (
            <div className="border-t border-[#f0e6d4] px-5 py-3 text-xs text-ink/50">
              Resend ticket email:
              {e.bookings.slice(0, 30).map((b) => (
                <form key={b.id} action={resendTickets.bind(null, b.id)} className="ml-2 inline">
                  <button className="underline hover:text-kumkum">{b.attendeeName.split(" ")[0]}</button>
                </form>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
