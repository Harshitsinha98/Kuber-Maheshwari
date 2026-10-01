import Link from "next/link";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import Intro from "@/components/home/Intro";
import ServicesScroll from "@/components/home/ServicesScroll";
import SundarkandFeature from "@/components/home/SundarkandFeature";
import Legends from "@/components/home/Legends";
import GalleryColumns from "@/components/home/GalleryColumns";
import LiveVideo from "@/components/home/LiveVideo";
import EventShowcase from "@/components/events/EventShowcase";
import { ArrowIcon } from "@/components/site/Icons";
import SocialFeed from "@/components/social/SocialFeed";
import { Reveal } from "@/components/motion/Reveal";
import { getUpcomingEvents } from "@/lib/queries";

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
    <section className="relative overflow-hidden bg-gradient-to-b from-night via-[#1c0a0e] to-night py-24 md:py-36">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_20%,rgba(232,130,12,0.18),transparent_70%),radial-gradient(40%_40%_at_10%_80%,rgba(158,42,43,0.25),transparent_70%)]" />
      <div className="relative mx-auto max-w-[1500px] px-5 md:px-10">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 font-hindi text-lg text-saffron">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-saffron opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-saffron" />
              </span>
              लाइव · आगामी कार्यक्रम
            </p>
            <h2 className="mt-3 font-hindi text-5xl leading-[1.35] text-ivory md:text-7xl">
              आइए, साथ में <span className="gold-text">गाएँ</span>
            </h2>
            <p className="mt-2 font-display text-2xl italic text-muted md:text-3xl">Live near you</p>
          </div>
          <Link href="/events" data-all-events className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-6 py-3 font-hindi text-base text-gold transition-colors hover:bg-gold hover:text-night">
            सभी कार्यक्रम <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
        {events.length ? (
          <EventShowcase events={events} />
        ) : (
          <Reveal>
            <div className="rounded-[28px] border border-gold/20 bg-night/40 py-16 text-center">
              <p className="font-hindi text-3xl text-ivory/85">नए कार्यक्रमों की घोषणा जल्द होगी</p>
              <p className="mt-3 text-sm text-muted">Planning an event? Invite Kuber ji to your city.</p>
              <Link href="/booking" className="mt-8 inline-flex h-12 items-center rounded-full bg-saffron px-7 font-hindi text-base font-semibold text-night">
                अपने आयोजन के लिए आमंत्रित करें
              </Link>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
