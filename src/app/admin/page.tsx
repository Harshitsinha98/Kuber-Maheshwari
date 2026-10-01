import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDate, inr } from "@/lib/format";
import { guard } from "./guard";
import { emailConfig } from "@/lib/email";
import { razorpayEnabled, razorpayTestMode, razorpayWebhookConfigured } from "@/lib/razorpay";
import { Card, PageTitle, btn, btnGhost } from "./ui";
import { site } from "@/lib/site";
import CopyLink from "./CopyLink";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await guard();
  const now = new Date();
  const IST = 5.5 * 3600e3;
  const istNow = new Date(now.getTime() + IST);
  const todayStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - IST);
  const weekAgo = new Date(now.getTime() - 7 * 86400e3);
  const [upcoming, paid, tickets, checked, newEnq, next, checkedToday, soldWeek] = await Promise.all([
    prisma.event.count({ where: { status: "PUBLISHED", startsAt: { gte: now } } }),
    prisma.booking.aggregate({ _sum: { amount: true }, _count: true, where: { status: "PAID" } }),
    prisma.ticket.count({ where: { booking: { status: "PAID" } } }),
    prisma.ticket.count({ where: { checkedInAt: { not: null } } }),
    prisma.enquiry.count({ where: { handled: false } }),
    prisma.event.findMany({
      where: { startsAt: { gte: new Date(now.getTime() - 6 * 3600e3) }, status: { not: "CANCELLED" } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { ticketTypes: true, bookings: { where: { status: "PAID" }, select: { quantity: true, amount: true } } },
    }),
    prisma.ticket.count({ where: { checkedInAt: { gte: todayStart } } }),
    prisma.booking.aggregate({ _sum: { quantity: true, amount: true }, where: { status: "PAID", createdAt: { gte: weekAgo } } }),
  ]);

  const stats = [
    ["Upcoming events", upcoming],
    ["Revenue", inr(paid._sum.amount || 0)],
    ["Tickets sold", tickets],
    ["Checked in today", `${checkedToday} (total ${checked})`],
    ["New enquiries", newEnq],
  ];
  const week = soldWeek._sum.quantity || 0;

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
          <Link href="/admin/email" className="underline">Email setup</Link>
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
      <p className="mb-3 text-sm text-ink/60">
        Last 7 days: <b>{week}</b> ticket{week === 1 ? "" : "s"} sold · <b>{inr(soldWeek._sum.amount || 0)}</b>
      </p>
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
              const sold = e.bookings.reduce((a, b) => a + b.quantity, 0);
              const rev = e.bookings.reduce((a, b) => a + b.amount, 0);
              const pct = cap ? Math.min(100, Math.round((sold / cap) * 100)) : 0;
              const days = Math.ceil((e.startsAt.getTime() - now.getTime()) / 86400e3);
              const url = `${site.url}/events/${e.slug}`;
              return (
                <li key={e.id} className="py-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/admin/events/${e.id}`} className="font-medium hover:text-kumkum">
                      {e.title} <span className="text-ink/50">· {e.city}</span>
                      {e.status === "DRAFT" && <span className="ml-2 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] uppercase">Draft</span>}
                    </Link>
                    <span className="text-ink/60">
                      {fmtDate(e.startsAt)} · {days <= 0 ? "today" : `in ${days} day${days > 1 ? "s" : ""}`}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#f0e6d4]">
                      <div className={`h-full rounded-full ${pct >= 80 ? "bg-kumkum" : "bg-saffron"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-44 shrink-0 text-right tabular-nums text-ink/70">
                      {sold}/{cap} sold ({pct}%) · {inr(rev)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href={`/admin/scan?event=${e.id}`} className={btnGhost}>
                      Scan
                    </Link>
                    <a href={`https://wa.me/?text=${encodeURIComponent(`🙏 ${e.title}\n${fmtDate(e.startsAt)} · ${e.venueName}, ${e.city}\nटिकट: ${url}`)}`} target="_blank" rel="noopener" className={btnGhost}>
                      Share on WhatsApp
                    </a>
                    <CopyLink url={url} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
