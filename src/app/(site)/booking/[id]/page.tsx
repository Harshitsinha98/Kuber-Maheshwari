import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureBookingTables } from "@/lib/booking-tables";
import { fmtDayKey, inr } from "@/lib/format";
import { site, waLink } from "@/lib/site";
import { Reveal, SplitText } from "@/components/motion/Reveal";
import { WhatsappIcon } from "@/components/site/Icons";
import StatusRefresher from "@/components/booking/StatusRefresher";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };

const copy: Record<string, { hi: string; en: string; tone: string }> = {
  CONFIRMED: { hi: "जय श्री राम! तारीख पक्की 🙏", en: "Your date is confirmed. Our team will call you to plan the programme.", tone: "text-emerald-300" },
  REQUESTED: { hi: "अनुरोध मिल गया 🙏", en: "We've received your booking request. Our team will call you shortly to confirm the date.", tone: "text-gold" },
  PENDING: { hi: "भुगतान की पुष्टि हो रही है…", en: "Waiting for the payment confirmation. This page updates by itself; if money was deducted, the booking is confirmed automatically.", tone: "text-gold" },
  CONFLICT: { hi: "भुगतान मिल गया", en: "We received your advance, but this date was booked a moment before your payment completed. Our team will call you right away to choose another date or refund you in full.", tone: "text-marigold" },
  FAILED: { hi: "भुगतान पूरा नहीं हुआ", en: "The payment did not go through, so the date was not booked. You can try again.", tone: "text-marigold" },
  CANCELLED: { hi: "बुकिंग रद्द", en: "This booking has been cancelled.", tone: "text-ivory/70" },
};

export default async function ShowBookingReceipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await ensureBookingTables().catch(() => {});
  const b = await prisma.showBooking.findUnique({ where: { id } }).catch(() => null);
  if (!b) notFound();
  const c = copy[b.status] ?? copy.PENDING;
  const answers = Array.isArray(b.answers) ? (b.answers as { question: string; answer: string }[]) : [];
  const balance = Math.max(0, b.total - b.paidAmount);

  return (
    <section className="mx-auto max-w-[1100px] px-5 pb-32 pt-36 md:px-10">
      {b.status === "PENDING" && <StatusRefresher />}
      <p className="text-xs uppercase tracking-[0.35em] text-gold">Booking {b.ref}</p>
      <SplitText as="h1" immediate text={c.hi} className={`mt-5 block font-hindi text-4xl leading-[1.4] md:text-6xl ${c.tone}`} />
      <Reveal delay={0.2}>
        <p className="mt-4 max-w-2xl text-lg text-ivory/75">{c.en}</p>
      </Reveal>

      <Reveal delay={0.3}>
        <div className="mt-12 grid gap-6 md:grid-cols-[1.3fr_1fr]">
          <dl className="divide-y divide-ivory/10 rounded-3xl border border-ivory/10 bg-night-2/70">
            {[
              ["तारीख", fmtDayKey(b.date)],
              ["कार्यक्रम", b.serviceName],
              ["स्थान", `${b.locationName}\n${b.venue}`],
              ...answers.map((a) => [a.question, a.answer]),
              ["नाम", `${b.name} · ${b.phone}`],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-4 px-6 py-4">
                <dt className="w-28 shrink-0 font-hindi text-sm text-muted">{k}</dt>
                <dd className="whitespace-pre-line text-ivory">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-gold/50 via-saffron/20 to-maroon/50 p-px">
              <div className="space-y-2 rounded-[23px] bg-night p-6">
                <div className="flex justify-between text-ivory/75">
                  <span className="font-hindi">कुल राशि</span>
                  <span className="tabular-nums">{inr(b.total)}</span>
                </div>
                <div className="flex justify-between text-emerald-300">
                  <span className="font-hindi">भुगतान हुआ</span>
                  <span className="tabular-nums">{inr(b.paidAmount)}</span>
                </div>
                <div className="hairline !my-4" />
                <div className="flex items-baseline justify-between">
                  <span className="font-hindi text-muted">शेष राशि</span>
                  <span className="font-display text-3xl text-ivory [font-variant-numeric:lining-nums_tabular-nums]">{inr(balance)}</span>
                </div>
              </div>
            </div>
            <a
              href={waLink(`नमस्ते, मेरी बुकिंग ${b.ref} (${fmtDayKey(b.date)}) के बारे में।`)}
              target="_blank"
              rel="noopener"
              className="flex h-14 items-center justify-center gap-3 rounded-full bg-[#1f9d55] font-hindi text-lg font-semibold text-white"
            >
              <WhatsappIcon className="h-5 w-5" /> व्हाट्सऐप पर बात करें
            </a>
            <a href={`tel:${site.phones[0].tel}`} className="flex h-12 items-center justify-center rounded-full border border-ivory/15 text-ivory/80 hover:border-gold">
              Call {site.phones[0].display}
            </a>
            {b.status === "FAILED" && (
              <Link href="/booking#book" className="flex h-12 items-center justify-center rounded-full bg-saffron font-hindi text-lg font-semibold text-night">
                फिर से बुक करें
              </Link>
            )}
            <p className="text-center text-xs text-muted">Save this page link to check your booking any time.</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
