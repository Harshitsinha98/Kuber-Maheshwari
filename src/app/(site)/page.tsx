import Link from "next/link";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import Intro from "@/components/home/Intro";
import ServicesScroll from "@/components/home/ServicesScroll";
import SundarkandFeature from "@/components/home/SundarkandFeature";
import Legends from "@/components/home/Legends";
import GalleryColumns from "@/components/home/GalleryColumns";
import LiveVideo from "@/components/home/LiveVideo";
import EventList from "@/components/events/EventList";
import SocialFeed from "@/components/social/SocialFeed";
import { Reveal } from "@/components/motion/Reveal";
import { getUpcomingEvents } from "@/lib/queries";
import Tracked from "@/components/site/Tracked";

export const revalidate = 60;

export default async function Home() {
  const events = await getUpcomingEvents(5);

  return (
    <>
      <Hero />
      <div className="relative z-10 -mt-2">
        <Marquee />
      </div>
      <Intro />
      <ServicesScroll />
      <UpcomingEvents events={events} />
      <SundarkandFeature />
      <Legends />
      <GalleryColumns />
      <LiveVideo />
      <SocialFeed />
    </>
  );
}

function UpcomingEvents({ events }: { events: Awaited<ReturnType<typeof getUpcomingEvents>> }) {
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-28 md:px-10 md:py-40">
      <div className="mb-14 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold"><Tracked text="Upcoming · आगामी कार्यक्रम" /></p>
          <h2 className="mt-4 font-display text-5xl leading-none md:text-7xl">
            Live <span className="italic text-gold">near you</span>
          </h2>
        </div>
        <Link href="/events" className="text-sm uppercase tracking-[0.2em] text-gold underline-offset-8 hover:underline">
          All events →
        </Link>
      </div>
      {events.length ? (
        <EventList events={events} />
      ) : (
        <Reveal>
          <div className="border-y border-ivory/10 py-16 text-center">
            <p className="font-display text-3xl italic text-ivory/80">New dates are being announced soon.</p>
            <p className="mt-3 text-sm text-muted">Planning an event? Invite Kuber ji to your city.</p>
            <Link href="/booking" className="mt-8 inline-flex h-12 items-center rounded-full border border-gold/50 px-7 text-xs uppercase tracking-[0.2em] text-gold hover:bg-gold hover:text-night">
              Send an enquiry
            </Link>
          </div>
        </Reveal>
      )}
    </section>
  );
}
