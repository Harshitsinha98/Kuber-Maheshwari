import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/site/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { site, waLink } from "@/lib/site";
import { FacebookIcon, InstagramIcon, WhatsappIcon, YoutubeIcon } from "@/components/site/Icons";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact Kuber Maheshwari, Indore: ${site.phones.map((p) => p.display).join(", ")}. WhatsApp, call, or check available dates and book online.`,
};

export default function Contact() {
  return (
    <>
      <PageHeader kicker="संपर्क · Contact" hi="आइए, बात करें" title="Let's talk" italic="bhakti." />
      <section className="mx-auto max-w-[1500px] px-5 md:px-10">
        <div className="grid gap-px bg-ivory/10 md:grid-cols-2">
          {site.phones.map((p, i) => (
            <Reveal key={p.tel} delay={i * 0.08} className="bg-night p-8 md:p-10">
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted">Phone {i + 1}</p>
              <a href={`tel:${p.tel}`} className="mt-4 block font-display text-4xl hover:text-gold">
                {p.display}
              </a>
              <a href={waLink(undefined, i)} target="_blank" rel="noopener" className="mt-5 inline-flex items-center gap-2 text-sm text-[#4ade80]">
                <WhatsappIcon className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </Reveal>
          ))}
          <Reveal delay={0.16} className="bg-night p-8 md:p-10">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted">Based in</p>
            <p className="mt-4 font-display text-4xl">Indore</p>
            <p className="mt-1 text-sm text-muted">Madhya Pradesh · Performing across India</p>
            <div className="mt-5 flex gap-3">
              {[
                [site.social.instagram, InstagramIcon, "Instagram"],
                [site.social.facebook, FacebookIcon, "Facebook"],
                [site.social.youtube, YoutubeIcon, "YouTube"],
              ].map(([h, I, l]) => {
                const Icon = I as typeof InstagramIcon;
                return (
                  <a key={l as string} href={h as string} target="_blank" rel="noopener" aria-label={l as string} className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 hover:border-gold hover:text-gold">
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1500px] gap-16 px-5 py-28 md:px-10 lg:grid-cols-2">
        <Reveal>
          <p className="font-hindi text-lg text-saffron">आयोजन बुकिंग</p>
          <h2 className="mt-2 font-display text-5xl leading-none md:text-6xl">
            Book <span className="italic text-gold">Kuber ji</span>
          </h2>
          <p className="mt-4 max-w-lg text-muted">
            See which dates are free on the calendar, choose your programme and venue, get the price instantly and pay a small advance online to lock your date.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/booking#book" className="inline-flex h-14 items-center rounded-full bg-saffron px-8 font-hindi text-lg font-semibold text-night transition-colors hover:bg-marigold">
              तारीख देखें, बुक करें
            </Link>
            <Link href="/events" className="inline-flex h-14 items-center rounded-full border border-ivory/20 px-8 text-sm uppercase tracking-[0.16em] text-ivory hover:border-gold hover:text-gold">
              Event tickets
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="aspect-square overflow-hidden border border-ivory/10 grayscale-[60%] invert-[0.9] hue-rotate-180 lg:aspect-auto lg:h-full">
            <iframe title="Indore" src="https://www.google.com/maps?q=Indore,+Madhya+Pradesh&output=embed" className="h-full min-h-[420px] w-full" loading="lazy" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
