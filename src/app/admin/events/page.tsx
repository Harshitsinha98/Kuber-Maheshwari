import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDate, fmtTime } from "@/lib/format";
import { guard } from "../guard";
import { Badge, Card, PageTitle, btn } from "../ui";

export const dynamic = "force-dynamic";

export default async function AdminEvents() {
  await guard();
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    include: {
      ticketTypes: { select: { capacity: true } },
      bookings: { where: { status: "PAID" }, select: { quantity: true } },
    },
  });
  return (
    <>
      <PageTitle title="Events & Tickets">
        <Link href="/admin/events/new" className={btn}>
          + New event
        </Link>
      </PageTitle>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-[#f7f0e2] text-left text-xs uppercase tracking-widest text-ink/60">
            <tr>
              <th className="px-5 py-3">Event</th>
              <th className="px-5 py-3">When</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Sold / Capacity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e6d4]">
            {events.map((e) => {
              const sold = e.bookings.reduce((a, b) => a + b.quantity, 0);
              const cap = e.ticketTypes.reduce((a, t) => a + t.capacity, 0);
              return (
                <tr key={e.id} className="hover:bg-[#fcf8f0]">
                  <td className="px-5 py-3">
                    <Link href={`/admin/events/${e.id}`} className="font-medium hover:text-kumkum">
                      {e.title}
                    </Link>
                    <div className="text-xs text-ink/50">
                      {e.venueName}, {e.city}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {fmtDate(e.startsAt)} · {fmtTime(e.startsAt)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={e.status === "PUBLISHED" ? "green" : e.status === "DRAFT" ? "gray" : "red"}>{e.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {sold} / {cap}
                  </td>
                </tr>
              );
            })}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-ink/50">
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
