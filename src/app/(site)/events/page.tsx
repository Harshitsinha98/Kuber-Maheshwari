import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/site/PageHeader";
import EventList from "@/components/events/EventList";
import { Reveal } from "@/components/motion/Reveal";
import { getPastEvents, getUpcomingEvents } from "@/lib/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Events & Tickets",
  description: "Upcoming bhajan sandhya, Sundarkand and Bhajan Clubbing events by Kuber Maheshwari. Book tickets online with instant QR e-tickets.",
};

export default async function Events() {
  const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents()]);
  return (
    <>
      <PageHeader
        kicker="कार्यक्रम · Events"
        title="Come, sing"
        italic="along."
        intro="Book online with your Google account. Your QR e-ticket arrives by email instantly and is scanned at the gate."
      />
      <section className="mx-auto max-w-[1500px] px-5 pb-28 md:px-10">
        {upcoming.length ? (
          <EventList events={upcoming} />
        ) : (
          <Reveal>
            <div className="border-y border-ivory/10 py-20 text-center">
              <p className="font-display text-4xl italic text-ivory/80">No public events announced right now.</p>
              <p className="mt-3 text-muted">Follow on social media for new dates, or invite Kuber ji to your event.</p>
              <Link href="/booking" className="mt-8 inline-flex h-12 items-center rounded-full bg-saffron px-7 text-xs font-semibold uppercase tracking-[0.2em] text-night">
                Send an enquiry
              </Link>
            </div>
          </Reveal>
        )}

        {past.length > 0 && (
          <div className="mt-32">
            <p className="mb-8 text-xs uppercase tracking-[0.35em] text-muted">Past events</p>
            <div className="opacity-70">
              <EventList events={past} past />
            </div>
          </div>
        )}
      </section>
    </>
  );
}
