import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureBookingTables } from "@/lib/booking-tables";
import { fmtDate, fmtDayKey, inr } from "@/lib/format";
import { waLink } from "@/lib/site";
import { guard } from "../../guard";
import { Badge, Card, PageTitle, btnGhost } from "../../ui";
import { statusLabel, statusTone } from "../status";
import BookingActions from "./BookingActions";

export const dynamic = "force-dynamic";

export default async function ShowBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  await guard("showbookings");
  await ensureBookingTables();
  const { id } = await params;
  const b = await prisma.showBooking.findUnique({ where: { id } });
  if (!b) notFound();
  const answers = Array.isArray(b.answers) ? (b.answers as { question: string; answer: string; price: number }[]) : [];
  const phone10 = b.phone.replace(/\D/g, "").slice(-10);
  const wa = waLink(`नमस्ते ${b.name} जी, ${b.serviceName} (${fmtDayKey(b.date)}) की बुकिंग ${b.ref} के बारे में।`).replace(/wa\.me\/\d+/, `wa.me/91${phone10}`);

  const lines: [string, number][] = [
    [b.serviceName, b.basePrice],
    [`Travel · ${b.locationName}`, b.travelCost],
    ...answers.filter((a) => a.price).map((a) => [`${a.question}: ${a.answer}`, a.price] as [string, number]),
  ];

  return (
    <>
      <PageTitle title={fmtDayKey(b.date, "en")} hi={`${b.ref} · ${fmtDayKey(b.date, "hi")}`}>
        <Link href="/admin/show-bookings" className={btnGhost}>
          ← All bookings
        </Link>
      </PageTitle>

      {b.status === "CONFLICT" && (
        <div className="mb-5 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-900">
          <b>The customer paid {inr(b.paidAmount)}, but this date was taken before the payment completed.</b> Move the booking to another free date below, or cancel it and refund the
          advance from the Razorpay dashboard (payment {b.razorpayPaymentId || "—"}).
        </div>
      )}
      {b.status === "REQUESTED" && (
        <div className="mb-5 rounded-2xl bg-sky-50 px-5 py-4 text-sm text-sky-900">No advance was taken online. Call the customer, then confirm to lock the date on the calendar.</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-3xl">{b.name}</p>
                <p className="text-ink/60">
                  {b.phone}
                  {b.email ? ` · ${b.email}` : ""}
                </p>
              </div>
              <Badge tone={statusTone(b.status)}>{statusLabel(b.status)}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:+91${phone10}`} className={btnGhost}>
                📞 Call
              </a>
              <a href={wa} target="_blank" rel="noopener" className={btnGhost}>
                💬 WhatsApp
              </a>
            </div>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-widest text-ink/50">Programme</dt>
                <dd>{b.serviceName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-ink/50">Location</dt>
                <dd>{b.locationName}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-widest text-ink/50">Venue</dt>
                <dd className="whitespace-pre-line">{b.venue}</dd>
              </div>
              {answers.map((a) => (
                <div key={a.question}>
                  <dt className="text-xs uppercase tracking-widest text-ink/50">{a.question}</dt>
                  <dd>{a.answer}</dd>
                </div>
              ))}
              {b.message && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-widest text-ink/50">Customer message</dt>
                  <dd className="whitespace-pre-line">{b.message}</dd>
                </div>
              )}
            </dl>
            <p className="mt-6 text-xs text-ink/45">Booked on {fmtDate(b.createdAt)}</p>
          </Card>

          <Card>
            <p className="font-display text-2xl">Price</p>
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-[#f0e6d4]">
                {lines.map(([l, a]) => (
                  <tr key={l}>
                    <td className="py-2 text-ink/70">{l}</td>
                    <td className="py-2 text-right tabular-nums">{inr(a)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right tabular-nums">{inr(b.total)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-ink/70">Advance asked ({b.advancePercent}%)</td>
                  <td className="py-2 text-right tabular-nums">{inr(b.advanceAmount)}</td>
                </tr>
                <tr className="text-green-800">
                  <td className="py-2">Received so far</td>
                  <td className="py-2 text-right tabular-nums">{inr(b.paidAmount)}</td>
                </tr>
                <tr className="font-semibold text-kumkum">
                  <td className="py-2">Balance due</td>
                  <td className="py-2 text-right tabular-nums">{inr(Math.max(0, b.total - b.paidAmount))}</td>
                </tr>
              </tbody>
            </table>
            {b.razorpayPaymentId && <p className="mt-3 text-xs text-ink/50">Razorpay payment: {b.razorpayPaymentId}</p>}
          </Card>
        </div>

        <BookingActions id={b.id} status={b.status} date={b.date} paid={b.paidAmount} total={b.total} note={b.adminNote ?? ""} />
      </div>
    </>
  );
}
