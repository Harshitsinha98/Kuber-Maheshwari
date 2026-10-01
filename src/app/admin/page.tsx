import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDate, inr } from "@/lib/format";
import { site } from "@/lib/site";
import { emailConfig } from "@/lib/email";
import { whatsappConfig } from "@/lib/whatsapp";
import { socialStatus } from "@/lib/social";
import { razorpayEnabled, razorpayTestMode, razorpayWebhookConfigured } from "@/lib/razorpay";
import { guard } from "./guard";
import { Card, btn, btnGhost } from "./ui";
import CopyLink from "./CopyLink";
import AutoRefresh from "./AutoRefresh";

export const dynamic = "force-dynamic";

const IST = 5.5 * 3600e3;
const istDayKey = (d: Date) => new Date(d.getTime() + IST).toISOString().slice(0, 10);
const startOfIstDay = (d: Date) => {
  const x = new Date(d.getTime() + IST);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()) - IST);
};

function ago(d: Date, now: Date) {
  const m = Math.round((now.getTime() - d.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const dd = Math.round(h / 24);
  return `${dd} day${dd > 1 ? "s" : ""} ago`;
}

function greeting(now: Date) {
  const h = new Date(now.getTime() + IST).getUTCHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Trend({ now, prev }: { now: number; prev: number }) {
  if (!now && !prev) return <span className="text-xs text-ink/40">—</span>;
  const pct = prev ? Math.round(((now - prev) / prev) * 100) : 100;
  const up = now >= prev;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

const K = ({ label, value, sub, trend, icon, tone = "saffron" }: { label: string; value: string | number; sub?: string; trend?: React.ReactNode; icon: string; tone?: "saffron" | "maroon" | "green" | "sky" }) => {
  const bg = { saffron: "bg-saffron/15 text-saffron", maroon: "bg-maroon/10 text-maroon", green: "bg-green-100 text-green-700", sky: "bg-sky-100 text-sky-700" }[tone];
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${bg}`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={icon} />
          </svg>
        </span>
        {trend}
      </div>
      <p className="mt-4 text-xs uppercase tracking-widest text-ink/50">{label}</p>
      <p className="mt-1 font-display text-3xl leading-tight md:text-4xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink/55">{sub}</p>}
    </Card>
  );
};

export default async function Dashboard() {
  const s = await guard();
  const now = new Date();
  const today = startOfIstDay(now);
  const d7 = new Date(now.getTime() - 7 * 86400e3);
  const d14 = new Date(now.getTime() - 14 * 86400e3);
  const d30 = startOfIstDay(new Date(now.getTime() - 29 * 86400e3));

  const [allTime, last30, recentBookings, recentEnquiries, recentCheckins, checkedToday, newEnq, events, social] = await Promise.all([
    prisma.booking.aggregate({ _sum: { amount: true, quantity: true }, _count: true, where: { status: "PAID" } }),
    prisma.booking.findMany({ where: { status: "PAID", createdAt: { gte: d14 < d30 ? d14 : d30 } }, select: { createdAt: true, amount: true, quantity: true } }),
    prisma.booking.findMany({ where: { status: "PAID" }, orderBy: { createdAt: "desc" }, take: 8, include: { event: { select: { title: true } }, ticketType: { select: { name: true } } } }),
    prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.ticket.findMany({ where: { checkedInAt: { not: null } }, orderBy: { checkedInAt: "desc" }, take: 5, include: { booking: { select: { attendeeName: true, event: { select: { title: true } } } } } }),
    prisma.ticket.count({ where: { checkedInAt: { gte: today } } }),
    prisma.enquiry.count({ where: { handled: false } }),
    prisma.event.findMany({
      where: { startsAt: { gte: new Date(now.getTime() - 6 * 3600e3) }, status: { not: "CANCELLED" } },
      orderBy: { startsAt: "asc" },
      take: 6,
      include: { ticketTypes: true, bookings: { where: { status: "PAID" }, select: { quantity: true, amount: true } } },
    }),
    socialStatus(),
  ]);

  // ---- trends: last 7 days vs the 7 before
  const sum = (from: Date, to: Date, f: "amount" | "quantity") => last30.filter((b) => b.createdAt >= from && b.createdAt < to).reduce((a, b) => a + b[f], 0);
  const rev7 = sum(d7, now, "amount"), revPrev = sum(d14, d7, "amount");
  const tix7 = sum(d7, now, "quantity"), tixPrev = sum(d14, d7, "quantity");
  const todayTix = sum(today, now, "quantity");

  // ---- 30-day chart (IST days)
  const days = Array.from({ length: 30 }, (_, i) => istDayKey(new Date(d30.getTime() + i * 86400e3 + 3600e3)));
  const byDay = new Map(days.map((d) => [d, { amount: 0, qty: 0 }]));
  for (const b of last30) {
    const k = istDayKey(b.createdAt);
    const v = byDay.get(k);
    if (v) {
      v.amount += b.amount;
      v.qty += b.quantity;
    }
  }
  const series = days.map((d) => ({ d, ...byDay.get(d)! }));
  const maxQty = Math.max(1, ...series.map((x) => x.qty));
  const total30 = series.reduce((a, x) => a + x.amount, 0);
  const qty30 = series.reduce((a, x) => a + x.qty, 0);

  // ---- activity feed
  type Act = { at: Date; kind: "booking" | "enquiry" | "checkin"; text: string; sub: string; href: string };
  const acts: Act[] = [
    ...recentBookings.map((b) => ({ at: b.createdAt, kind: "booking" as const, text: `${b.attendeeName} booked ${b.quantity} × ${b.ticketType.name}`, sub: `${b.event.title} · ${inr(b.amount)}`, href: `/bookings/${b.id}` })),
    ...recentEnquiries.map((e) => ({ at: e.createdAt, kind: "enquiry" as const, text: `${e.name} enquired about ${e.eventType}`, sub: [e.city, e.eventDate, e.phone].filter(Boolean).join(" · "), href: "/admin/enquiries" })),
    ...recentCheckins.map((t) => ({ at: t.checkedInAt!, kind: "checkin" as const, text: `${t.booking.attendeeName} checked in`, sub: t.booking.event.title, href: "/admin/scan" })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 10);
  const actStyle = { booking: ["🎟️", "bg-saffron/15"], enquiry: ["📩", "bg-sky-100"], checkin: ["✅", "bg-green-100"] } as const;

  // ---- setup checklist
  const wa = whatsappConfig();
  const em = emailConfig();
  const checklist: { label: string; state: "ok" | "warn" | "off"; note: string; href: string }[] = [
    {
      label: "Online payments (Razorpay)",
      state: !razorpayEnabled() ? "off" : razorpayTestMode() || !razorpayWebhookConfigured() ? "warn" : "ok",
      note: !razorpayEnabled() ? "Off: paid tickets use WhatsApp booking" : razorpayTestMode() ? "Test mode: no real money" : !razorpayWebhookConfigured() ? "Webhook secret missing" : "Live",
      href: "https://dashboard.razorpay.com",
    },
    { label: "WhatsApp alerts", state: wa.enabled && wa.notify.length ? "ok" : "off", note: wa.enabled && wa.notify.length ? `To ${wa.notify.map((n) => "+" + n).join(", ")}` : "Not set up", href: "/admin/whatsapp" },
    { label: "Email", state: !em.enabled ? "off" : em.sandbox ? "warn" : "ok", note: !em.enabled ? "Not set up" : em.sandbox ? "Testing mode (no domain yet)" : "Own domain", href: "/admin/email" },
    { label: "Instagram feed", state: social.instagram ? "ok" : "off", note: social.instagram ? "Connected" : "Not connected", href: "/admin/social" },
    { label: "Facebook feed", state: social.facebook ? "ok" : "off", note: social.facebook ? "Connected" : "Not connected", href: "/admin/social" },
  ];
  const done = checklist.filter((c) => c.state === "ok").length;
  const dot = { ok: "bg-green-500", warn: "bg-amber-400", off: "bg-stone-300" };

  const first = (s.user.name || "").split(" ")[0];
  const nextEvent = events.find((e) => e.status === "PUBLISHED");

  return (
    <>
      {/* ---------- greeting ---------- */}
      <div className="relative mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#4a0f19] via-[#2a0810] to-[#1d1416] p-6 text-ivory md:p-8">
        <div className="toran absolute inset-x-0 top-0" aria-hidden />
        <div className="pointer-events-none absolute -right-10 -top-6 font-hindi text-[10rem] leading-none text-gold/10" aria-hidden>
          ॐ
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-4 pt-3">
          <div>
            <p className="text-lg text-gold-soft">{greeting(now)}{first ? `, ${first} ji` : ""} 🙏</p>
            <h1 className="mt-1 font-display text-4xl md:text-5xl">Today at a glance</h1>
            <p className="mt-2 text-sm text-ivory/70">
              {new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" }).format(now)} ·{" "}
              {todayTix} tickets sold today · {checkedToday} checked in today · {newEnq} new enquir{newEnq === 1 ? "y" : "ies"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AutoRefresh />
            <Link href="/admin/events/new" className={btn}>
              + New event
            </Link>
            {nextEvent && (
              <Link href={`/admin/scan?event=${nextEvent.id}`} className="inline-flex items-center rounded-full border border-ivory/25 px-4 py-2.5 text-sm hover:border-gold hover:text-gold">
                Scan tickets
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ---------- KPIs ---------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <K label="Revenue · 7 days" value={inr(rev7)} sub={`All time ${inr(allTime._sum.amount || 0)}`} trend={<Trend now={rev7} prev={revPrev} />} icon="M6 4h12M6 9h12M10 4c4 0 6 2 6 5s-2 5-6 5H7l8 7" />
        <K label="Tickets · 7 days" value={tix7} sub={`All time ${allTime._sum.quantity || 0} tickets · ${allTime._count} bookings`} trend={<Trend now={tix7} prev={tixPrev} />} icon="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4zM9 7v12" tone="maroon" />
        <K label="Checked in today" value={checkedToday} sub="Tickets scanned at the gate" icon="M5 12.5l4.5 4.5L19 7.5" tone="green" />
        <K label="New enquiries" value={newEnq} sub={newEnq ? "Awaiting your reply" : "All caught up"} icon="M4 5h16v11H8l-4 4z" tone="sky" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* ---------- chart ---------- */}
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-semibold">Sales · last 30 days</h2>
              <p className="text-sm text-ink/55">
                {qty30} tickets · {inr(total30)}
              </p>
            </div>
            <span className="text-xs text-ink/45">Each bar = one day (tickets)</span>
          </div>
          <div className="mt-5 flex h-44 items-end gap-[3px]" role="img" aria-label="Tickets sold per day, last 30 days">
            {series.map((x, i) => (
              <div key={x.d} className="group relative flex h-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-md transition-colors ${x.qty ? (i === series.length - 1 ? "bg-saffron" : "bg-maroon/75 group-hover:bg-saffron") : "bg-[#efe5d2]"}`}
                  style={{ height: `${x.qty ? Math.max(6, (x.qty / maxQty) * 100) : 3}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] text-ivory group-hover:block">
                  {new Date(x.d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {x.qty} tickets · {inr(x.amount)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-ink/45">
            <span>{new Date(days[0]).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            <span>Today</span>
          </div>
        </Card>

        {/* ---------- checklist ---------- */}
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Setup checklist</h2>
            <span className="text-sm text-ink/55">
              {done}/{checklist.length} ready
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0e6d4]">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${(done / checklist.length) * 100}%` }} />
          </div>
          <ul className="mt-4 space-y-2">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[#faf4e8]">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot[c.state]}`} />
                  <span className="flex-1 text-sm">{c.label}</span>
                  <span className="text-right text-xs text-ink/55">{c.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* ---------- events ---------- */}
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Upcoming events</h2>
            <Link href="/admin/events" className="text-sm text-kumkum hover:underline">
              View all
            </Link>
          </div>
          {events.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-[#faf4e8] p-6 text-center">
              <p className="text-sm text-ink/60">No upcoming events yet.</p>
              <Link href="/admin/events/new" className={`${btn} mt-4`}>
                Create your first event
              </Link>
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-[#f0e6d4]">
              {events.map((e) => {
                const cap = e.ticketTypes.reduce((a, t) => a + t.capacity, 0);
                const sold = e.bookings.reduce((a, b) => a + b.quantity, 0);
                const rev = e.bookings.reduce((a, b) => a + b.amount, 0);
                const pct = cap ? Math.min(100, Math.round((sold / cap) * 100)) : 0;
                const daysLeft = Math.ceil((e.startsAt.getTime() - now.getTime()) / 86400e3);
                const url = `${site.url}/events/${e.slug}`;
                return (
                  <li key={e.id} className="py-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/admin/events/${e.id}`} className="font-medium hover:text-kumkum">
                        {e.title} <span className="text-ink/50">· {e.city}</span>
                        {e.status === "DRAFT" && <span className="ml-2 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] uppercase">Draft</span>}
                      </Link>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs ${daysLeft <= 2 ? "bg-kumkum text-ivory" : "bg-[#f3ead8] text-ink/70"}`}>
                        {fmtDate(e.startsAt)} · {daysLeft <= 0 ? "today" : `in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#f0e6d4]">
                        <div className={`h-full rounded-full ${pct >= 80 ? "bg-kumkum" : "bg-saffron"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-44 shrink-0 text-right tabular-nums text-ink/70">
                        {sold}/{cap} ({pct}%) · {inr(rev)}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <Link href={`/admin/scan?event=${e.id}`} className={btnGhost}>
                        Scan
                      </Link>
                      <a href={`https://wa.me/?text=${encodeURIComponent(`🙏 ${e.title}\n${fmtDate(e.startsAt)} · ${e.venueName}, ${e.city}\nटिकट: ${url}`)}`} target="_blank" rel="noopener" className={btnGhost}>
                        Share on WhatsApp
                      </a>
                      <CopyLink url={url} />
                      <a href={`/admin/events/${e.id}/export`} className={btnGhost}>
                        Attendee list
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* ---------- activity ---------- */}
        <Card>
          <h2 className="font-semibold">Recent activity</h2>
          {acts.length === 0 ? (
            <p className="mt-4 text-sm text-ink/55">No bookings or enquiries yet. They will appear here as they come in.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {acts.map((a, i) => (
                <li key={i}>
                  <Link href={a.href} className="flex items-start gap-3 rounded-xl p-1.5 hover:bg-[#faf4e8]">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${actStyle[a.kind][1]}`} aria-hidden>
                      {actStyle[a.kind][0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug">{a.text}</span>
                      <span className="block truncate text-xs text-ink/50">{a.sub}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-ink/40">{ago(a.at, now)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
