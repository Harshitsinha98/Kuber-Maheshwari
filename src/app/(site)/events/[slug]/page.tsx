import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getEvent, seatsLeftForEvent } from "@/lib/queries";
import { fmtDate, fmtDateHi, fmtTime, fmtTimeHi, rupees } from "@/lib/format";
import { razorpayEnabled, razorpayTestMode } from "@/lib/razorpay";
import { site } from "@/lib/site";
import { getSession } from "@/lib/auth";
import { Reveal, SplitText } from "@/components/motion/Reveal";
import TicketPicker from "@/components/events/TicketPicker";
import { Countdown } from "@/components/events/EventShowcase";
import EventShare from "@/components/events/EventShare";
import MobileBookBar from "@/components/events/MobileBookBar";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  if (!e) return {};
  return {
    title: `${e.title}, ${e.city} · ${fmtDate(e.startsAt)}`,
    description: e.subtitle || e.description.slice(0, 160),
  };
}

export default async function EventPage({ params }: Props) {
  const isAdmin = (await getSession())?.user?.role === "ADMIN";
  const e = await getEvent((await params).slug, isAdmin);
  if (!e) notFound();
  const draft = e.status === "DRAFT";

  const left = await seatsLeftForEvent(e.id, e.ticketTypes);
  const types = e.ticketTypes.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    price: t.price,
    maxPerOrder: t.maxPerOrder,
    remaining: left.get(t.id) ?? 0,
  }));
  const place = `${e.venueName}, ${e.address}, ${e.city}`;
  const seatsLeft = types.reduce((a, t) => a + t.remaining, 0);
  const capacity = e.ticketTypes.reduce((a, t) => a + t.capacity, 0);
  const paid = types.map((t) => t.price).filter((x) => x > 0);
  const fromPrice = types.length ? (paid.length ? Math.min(...paid) : 0) : null;
  const mapQ = encodeURIComponent(place);
  const past = e.startsAt.getTime() < Date.now() - 6 * 3600e3;
  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${iso(e.startsAt)}/${iso(
    e.endsAt || new Date(e.startsAt.getTime() + 3 * 3600e3)
  )}&location=${mapQ}&details=${encodeURIComponent(site.url + "/events/" + e.slug)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: e.title,
    startDate: e.startsAt.toISOString(),
    eventStatus: e.status === "CANCELLED" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: e.venueName, address: `${e.address}, ${e.city}` },
    performer: { "@type": "Person", name: "Kuber Maheshwari" },
    image: e.posterUrl || `${site.url}/images/gallery/kuber-25.webp`,
    offers: e.ticketTypes.map((t) => ({ "@type": "Offer", name: t.name, price: t.price / 100, priceCurrency: "INR", url: `${site.url}/events/${e.slug}` })),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="relative h-[78vh] min-h-[520px] overflow-hidden">
        <Image src={e.posterUrl || "/images/gallery/kuber-25.webp"} alt={e.title} fill priority quality={90} sizes="100vw" className="object-cover object-[50%_30%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/60 to-night/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#3a0b12]/70 to-transparent" />
        <div className="toran absolute inset-x-0 top-20 z-10 md:top-24" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1500px] px-5 pb-14 md:px-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-gold/50 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-soft">{e.category}</span>
            {!past && e.status === "PUBLISHED" && capacity > 0 && (
              <span
                className={`rounded-full px-3.5 py-1 font-hindi text-sm font-semibold ${
                  seatsLeft === 0 ? "bg-kumkum text-ivory" : seatsLeft <= Math.max(20, capacity * 0.2) ? "animate-pulse bg-kumkum text-ivory" : "bg-[#1f9d55] text-white"
                }`}
              >
                {seatsLeft === 0 ? "हाउसफुल" : seatsLeft <= Math.max(20, capacity * 0.2) ? `सिर्फ़ ${seatsLeft} सीटें बाकी` : "टिकट बुकिंग शुरू"}
              </span>
            )}
          </div>
          <SplitText as="h1" immediate text={e.title} className="mt-4 block max-w-5xl font-display text-5xl leading-[0.95] text-ivory md:text-8xl" />
          {e.subtitle && <p className="mt-4 max-w-2xl text-lg text-ivory/75">{e.subtitle}</p>}
          <p className="mt-4 font-hindi text-xl text-ivory/90">
            {fmtDateHi(e.startsAt)} · {fmtTimeHi(e.startsAt)} · {e.venueName}, {e.city}
          </p>
          {!past && e.status === "PUBLISHED" && (
            <div className="mt-6">
              <Countdown iso={e.startsAt.toISOString()} />
            </div>
          )}
          {draft && (
            <p className="mt-6 inline-block rounded-full bg-marigold px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-night">
              Draft preview · only admins can see this. Set status to Published to show it on the website.
            </p>
          )}
          {e.status === "CANCELLED" && (
            <p className="mt-6 inline-block rounded-full bg-kumkum px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">This event has been cancelled</p>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] gap-16 px-5 py-20 md:px-10 lg:grid-cols-[1fr_460px]">
        <div>
          <Reveal>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-gold/20 bg-gradient-to-br from-[#241014] to-night p-6">
                <dt className="font-hindi text-sm text-saffron">तारीख़</dt>
                <dd className="mt-2 font-hindi text-xl leading-snug text-ivory">{fmtDateHi(e.startsAt)}</dd>
                <dd className="text-sm text-muted">{fmtDate(e.startsAt)}</dd>
              </div>
              <div className="rounded-3xl border border-gold/20 bg-gradient-to-br from-[#241014] to-night p-6">
                <dt className="font-hindi text-sm text-saffron">समय</dt>
                <dd className="mt-2 font-display text-2xl text-ivory">{fmtTime(e.startsAt)}</dd>
                {e.gatesOpenAt && <dd className="font-hindi text-sm text-muted">प्रवेश {fmtTimeHi(e.gatesOpenAt)} से</dd>}
              </div>
              <div className="rounded-3xl border border-gold/20 bg-gradient-to-br from-[#241014] to-night p-6">
                <dt className="font-hindi text-sm text-saffron">स्थान</dt>
                <dd className="mt-2 font-display text-2xl leading-tight text-ivory">{e.venueName}</dd>
                <dd className="text-sm text-muted">
                  {e.address}, {e.city}
                </dd>
              </div>
            </dl>
          </Reveal>
          <Reveal>
            <div className="mt-12 whitespace-pre-line text-lg leading-relaxed text-ivory/75">{e.description}</div>
          </Reveal>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href={e.mapUrl || `https://www.google.com/maps/search/?api=1&query=${mapQ}`} target="_blank" rel="noopener" className="rounded-full border border-ivory/20 px-5 py-3 font-hindi text-base hover:border-gold hover:text-gold">
              रास्ता देखें
            </a>
            <a href={gcal} target="_blank" rel="noopener" className="rounded-full border border-ivory/20 px-5 py-3 font-hindi text-base hover:border-gold hover:text-gold">
              कैलेंडर में जोड़ें
            </a>
            <EventShare title={e.title} line={`${fmtDateHi(e.startsAt)} · ${fmtTimeHi(e.startsAt)} · ${e.venueName}, ${e.city}`} url={`${site.url}/events/${e.slug}`} />
          </div>
          <div className="mt-12 aspect-[16/9] overflow-hidden border border-ivory/10 grayscale-[60%] invert-[0.9] hue-rotate-180">
            <iframe title="Venue map" src={`https://www.google.com/maps?q=${mapQ}&output=embed`} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </div>

        <aside id="tickets" className="scroll-mt-28 lg:sticky lg:top-28 lg:self-start">
          <TicketPicker
            event={{ id: e.id, slug: e.slug, title: e.title }}
            types={types}
            disabled={e.status === "CANCELLED" || past || draft}
            disabledReason={draft ? "Not published yet" : e.status === "CANCELLED" ? "Event cancelled" : past ? "This event has ended" : undefined}
            paymentsEnabled={razorpayEnabled()}
            testMode={razorpayEnabled() && razorpayTestMode()}
          />
        </aside>
      </div>
      <MobileBookBar
        price={fromPrice === null ? null : fromPrice === 0 ? "निःशुल्क" : rupees(fromPrice)}
        label={draft ? "प्रकाशित नहीं" : e.status === "CANCELLED" ? "कार्यक्रम रद्द" : past ? "कार्यक्रम समाप्त" : "हाउसफुल"}
        disabled={draft || e.status === "CANCELLED" || past || seatsLeft === 0}
      />
    </article>
  );
}

const iso = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
