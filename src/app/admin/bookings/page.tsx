import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDate, rupees } from "@/lib/format";
import { guard } from "../guard";
import { Badge, Card, PageTitle, btnGhost } from "../ui";

export const dynamic = "force-dynamic";

export default async function Bookings({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await guard();
  const { q, status } = await searchParams;
  const bookings = await prisma.booking.findMany({
    where: {
      ...(status ? { status: status as "PAID" } : {}),
      ...(q
        ? {
            OR: [
              { attendeeName: { contains: q, mode: "insensitive" } },
              { attendeePhone: { contains: q } },
              { attendeeEmail: { contains: q, mode: "insensitive" } },
              { tickets: { some: { code: q.toUpperCase() } } },
            ],
          }
        : {}),
    },
    include: { event: true, ticketType: true, tickets: { select: { checkedInAt: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageTitle title="Bookings">
        <a href={`/admin/bookings/export${status ? `?status=${status}` : ""}`} className={btnGhost}>
          Download Excel (CSV)
        </a>
      </PageTitle>
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, phone, email, ticket code" className="admin-input max-w-md" />
        <select name="status" defaultValue={status || ""} className="admin-input w-40">
          <option value="">All</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <button className="rounded-full bg-ink px-5 text-sm text-ivory">Search</button>
      </form>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-[#f7f0e2] text-left text-xs uppercase tracking-widest text-ink/60">
            <tr>
              <th className="px-5 py-3">Attendee</th>
              <th className="px-5 py-3">Event</th>
              <th className="px-5 py-3">Tickets</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e6d4]">
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="px-5 py-3">
                  <Link href={`/bookings/${b.id}`} className="font-medium hover:text-kumkum">
                    {b.attendeeName}
                  </Link>
                  <div className="text-xs text-ink/50">
                    {b.attendeePhone} · {b.attendeeEmail}
                  </div>
                </td>
                <td className="px-5 py-3">
                  {b.event.title}
                  <div className="text-xs text-ink/50">{fmtDate(b.event.startsAt)}</div>
                </td>
                <td className="px-5 py-3">
                  {b.quantity} × {b.ticketType.name}
                  {b.tickets.length > 0 && (
                    <div className="text-xs text-ink/50">
                      {b.tickets.filter((t) => t.checkedInAt).length}/{b.tickets.length} checked in
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 tabular-nums">{rupees(b.amount)}</td>
                <td className="px-5 py-3">
                  <Badge tone={b.status === "PAID" ? "green" : b.status === "PENDING" ? "amber" : "red"}>{b.status}</Badge>
                  {b.status === "PAID" && !b.emailSentAt && (
                    <Link href="/admin/email" className="ml-1 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-800 hover:underline">
                      ✉ not emailed
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink/50">
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
