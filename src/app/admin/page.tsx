import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDate, inr } from "@/lib/format";
import { guard } from "./guard";
import { emailConfig } from "@/lib/email";
import { razorpayEnabled, razorpayTestMode, razorpayWebhookConfigured } from "@/lib/razorpay";
import { Card, PageTitle, btn } from "./ui";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await guard();
  const now = new Date();
  const [upcoming, paid, tickets, checked, newEnq, next] = await Promise.all([
    prisma.event.count({ where: { status: "PUBLISHED", startsAt: { gte: now } } }),
    prisma.booking.aggregate({ _sum: { amount: true }, _count: true, where: { status: "PAID" } }),
    prisma.ticket.count({ where: { booking: { status: "PAID" } } }),
    prisma.ticket.count({ where: { checkedInAt: { not: null } } }),
    prisma.enquiry.count({ where: { handled: false } }),
    prisma.event.findMany({
      where: { startsAt: { gte: now }, status: { not: "CANCELLED" } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { ticketTypes: true, _count: { select: { bookings: { where: { status: "PAID" } } } } },
    }),
  ]);

  const stats = [
    ["Upcoming events", upcoming],
    ["Revenue", inr(paid._sum.amount || 0)],
    ["Tickets sold", tickets],
    ["Checked in", checked],
    ["New enquiries", newEnq],
  ];

  return (
    <>
      <PageTitle title="Dashboard">
        <Link href="/admin/events/new" className={btn}>
          + New event
        </Link>
      </PageTitle>
      {!emailConfig().enabled && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <b>Email is off</b>: add <code>RESEND_API_KEY</code> in Vercel and redeploy. Tickets still appear under My Tickets.{" "}
          <Link href="/admin/email" className="underline">Email setup →</Link>
        </p>
      )}
      {!razorpayEnabled() ? (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <b>Online payments are off</b>: Razorpay is not connected. Paid tickets show a WhatsApp booking button; free passes work normally.
        </p>
      ) : (
        <>
          {razorpayTestMode() && (
            <p className="mb-4 rounded-lg border border-sky-300 bg-sky-50 p-3 text-sm text-sky-900">
              <b>Razorpay TEST mode</b>: checkout works but no real money is charged. Switch to live keys (rzp_live_…) before selling real tickets.
            </p>
          )}
          {!razorpayWebhookConfigured() && (
            <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <b>Razorpay webhook secret missing.</b> Payments work, but if a buyer closes the browser right after paying, their ticket won&apos;t be issued automatically. Add <code>RAZORPAY_WEBHOOK_SECRET</code> (see README).
            </p>
          )}
        </>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map(([k, v]) => (
          <Card key={k as string}>
            <p className="text-xs uppercase tracking-widest text-ink/50">{k}</p>
            <p className="mt-2 font-display text-3xl">{v}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <h2 className="mb-4 font-semibold">Next events</h2>
        {next.length === 0 ? (
          <p className="text-sm text-ink/60">No upcoming events. Create one to start selling tickets.</p>
        ) : (
          <ul className="divide-y divide-[#f0e6d4]">
            {next.map((e) => {
              const cap = e.ticketTypes.reduce((a, t) => a + t.capacity, 0);
              return (
                <li key={e.id} className="flex items-center justify-between py-3 text-sm">
                  <Link href={`/admin/events/${e.id}`} className="font-medium hover:text-kumkum">
                    {e.title} <span className="text-ink/50">· {e.city}</span>
                  </Link>
                  <span className="text-ink/60">
                    {fmtDate(e.startsAt)} · {e._count.bookings} bookings · capacity {cap}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
