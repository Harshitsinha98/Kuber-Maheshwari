import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getEvent } from "@/lib/queries";
import { remainingSeats } from "@/lib/tickets";
import { fmtDate, fmtTime } from "@/lib/format";
import { razorpayEnabled } from "@/lib/razorpay";
import { site } from "@/lib/site";
import { Reveal, SplitText } from "@/components/motion/Reveal";
import TicketPicker from "@/components/events/TicketPicker";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  if (!e) return {};
  return {
    title: `${e.title}, ${e.city} · ${fmtDate(e.startsAt)}`,
    description: e.subtitle || e.description.slice(0, 160),
    openGraph: { images: e.posterUrl ? [e.posterUrl] : ["/images/gallery/kuber-01.webp"] },
  };
}

export default async function EventPage({ params }: Props) {
  const e = await getEvent((await params).slug);
  if (!e) notFound();

  const types = await Promise.all(
    e.ticketTypes.map(async (t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      price: t.price,
      maxPerOrder: t.maxPerOrder,
      remaining: await remainingSeats(t.id),
    }))
  );
  const place = `${e.venueName}, ${e.address}, ${e.city}`;
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
    image: e.posterUrl || `${site.url}/images/gallery/kuber-01.webp`,
    offers: e.ticketTypes.map((t) => ({ "@type": "Offer", name: t.name, price: t.price / 100, priceCurrency: "INR", url: `${site.url}/events/${e.slug}` })),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="relative h-[78vh] min-h-[520px] overflow-hidden">
        <Image src={e.posterUrl || "/images/gallery/kuber-01.webp"} alt={e.title} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/60 to-night/20" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1500px] px-5 pb-14 md:px-10">
          <p className="text-xs uppercase tracking-[0.35em] text-saffron">{e.category}</p>
          <SplitText as="h1" immediate text={e.title} className="mt-4 block max-w-5xl font-display text-5xl leading-[0.95] text-ivory md:text-8xl" />
          {e.subtitle && <p className="mt-4 max-w-2xl text-lg text-ivory/75">{e.subtitle}</p>}
          {e.status === "CANCELLED" && (
            <p className="mt-6 inline-block rounded-full bg-kumkum px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">This event has been cancelled</p>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] gap-16 px-5 py-20 md:px-10 lg:grid-cols-[1fr_460px]">
        <div>
          <Reveal>
            <dl className="grid gap-8 border-y border-ivory/10 py-10 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.3em] text-muted">Date</dt>
                <dd className="mt-2 font-display text-2xl">{fmtDate(e.startsAt)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.3em] text-muted">Time</dt>
                <dd className="mt-2 font-display text-2xl">
                  {fmtTime(e.startsAt)}
                  {e.gatesOpenAt && <span className="block text-sm text-muted">Gates open {fmtTime(e.gatesOpenAt)}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.3em] text-muted">Venue</dt>
                <dd className="mt-2 font-display text-2xl">{e.venueName}</dd>
                <dd className="text-sm text-muted">
                  {e.address}, {e.city}
                </dd>
              </div>
            </dl>
          </Reveal>
          <Reveal>
            <div className="mt-12 whitespace-pre-line text-lg leading-relaxed text-ivory/75">{e.description}</div>
          </Reveal>
          <div className="mt-10 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em]">
            <a href={e.mapUrl || `https://www.google.com/maps/search/?api=1&query=${mapQ}`} target="_blank" rel="noopener" className="rounded-full border border-ivory/20 px-5 py-3 hover:border-gold hover:text-gold">
              Get directions
            </a>
            <a href={gcal} target="_blank" rel="noopener" className="rounded-full border border-ivory/20 px-5 py-3 hover:border-gold hover:text-gold">
              Add to calendar
            </a>
          </div>
          <div className="mt-12 aspect-[16/9] overflow-hidden border border-ivory/10 grayscale-[60%] invert-[0.9] hue-rotate-180">
            <iframe title="Venue map" src={`https://www.google.com/maps?q=${mapQ}&output=embed`} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <TicketPicker
            event={{ id: e.id, slug: e.slug, title: e.title }}
            types={types}
            disabled={e.status === "CANCELLED" || past}
            disabledReason={e.status === "CANCELLED" ? "Event cancelled" : past ? "This event has ended" : undefined}
            paymentsEnabled={razorpayEnabled()}
          />
        </aside>
      </div>
    </article>
  );
}

const iso = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
