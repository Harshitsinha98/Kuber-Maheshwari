import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureBookingTables } from "@/lib/booking-tables";
import { fmtDayKey, inr, istDayKey } from "@/lib/format";
import { guard } from "../guard";
import { Badge, Card, PageTitle, btnGhost } from "../ui";
import { statusLabel, statusTone } from "./status";

export const dynamic = "force-dynamic";


const tabs = [
  ["action", "Needs action"],
  ["upcoming", "Upcoming"],
  ["past", "Past"],
  ["all", "All"],
] as const;

export default async function ShowBookings({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  await guard("showbookings");
  await ensureBookingTables();
  const { tab: t, q } = await searchParams;
  const today = istDayKey();
  const counts = await prisma.showBooking.groupBy({ by: ["status"], _count: true });
  const needs = counts.filter((c) => c.status === "REQUESTED" || c.status === "CONFLICT").reduce((a, c) => a + c._count, 0);
  const tab = t && tabs.some(([k]) => k === t) ? t : needs ? "action" : "upcoming";

  const where: Prisma.ShowBookingWhereInput = {
    ...(tab === "action" ? { status: { in: ["REQUESTED", "CONFLICT"] } } : {}),
    ...(tab === "upcoming" ? { status: "CONFIRMED", date: { gte: today } } : {}),
    ...(tab === "past" ? { status: "CONFIRMED", date: { lt: today } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { ref: { contains: q.toUpperCase() } },
            { locationName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const rows = await prisma.showBooking.findMany({
    where,
    orderBy: tab === "past" || tab === "all" ? [{ date: "desc" }] : [{ date: "asc" }],
    take: 300,
  });
  const upcomingTotal = rows.filter((r) => r.status === "CONFIRMED").reduce((a, r) => a + r.total - r.paidAmount, 0);

  return (
    <>
      <PageTitle title="Show Bookings" hi="आयोजन बुकिंग">
        <Link href="/admin/calendar" className={btnGhost}>
          Calendar
        </Link>
        <Link href="/admin/booking-setup" className={btnGhost}>
          Prices & questions
        </Link>
      </PageTitle>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map(([k, l]) => (
          <Link key={k} href={`?tab=${k}`} className={`rounded-full px-4 py-2 text-sm ${tab === k ? "bg-ink text-ivory" : "bg-white ring-1 ring-[#ecdfc7]"}`}>
            {l}
            {k === "action" && needs > 0 && <span className="ml-2 rounded-full bg-kumkum px-1.5 text-[11px] text-ivory">{needs}</span>}
          </Link>
        ))}
        <form className="ml-auto flex gap-2">
          <input type="hidden" name="tab" value="all" />
          <input name="q" defaultValue={q} placeholder="Name, phone, city or KM- code" className="admin-input w-64" />
          <button className="rounded-full bg-ink px-5 text-sm text-ivory">Search</button>
        </form>
      </div>

      {tab === "upcoming" && rows.length > 0 && <p className="mb-3 text-sm text-ink/60">Balance still to collect on these: {inr(upcomingTotal)}</p>}

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-[#f7f0e2] text-left text-xs uppercase tracking-widest text-ink/60">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Programme · Location</th>
              <th className="px-5 py-3">Paid / Total</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e6d4]">
            {rows.map((b) => (
              <tr key={b.id} className="hover:bg-[#fffaf0]">
                <td className="px-5 py-3">
                  <Link href={`/admin/show-bookings/${b.id}`} className="font-medium hover:text-kumkum">
                    {fmtDayKey(b.date, "en")}
                  </Link>
                  <div className="text-xs text-ink/50">{b.ref}</div>
                </td>
                <td className="px-5 py-3">
                  {b.name}
                  <div className="text-xs text-ink/50">{b.phone}</div>
                </td>
                <td className="px-5 py-3">
                  {b.serviceName}
                  <div className="text-xs text-ink/50">{b.locationName}</div>
                </td>
                <td className="px-5 py-3 tabular-nums">
                  {inr(b.paidAmount)} / {inr(b.total)}
                </td>
                <td className="px-5 py-3">
                  <Badge tone={statusTone(b.status)}>{statusLabel(b.status)}</Badge>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink/50">
                  {tab === "action" ? "Nothing waiting for you. 🙏" : "No bookings here yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
