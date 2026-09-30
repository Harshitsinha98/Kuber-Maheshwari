import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import EnquiryForm from "@/components/site/EnquiryForm";
import { Reveal } from "@/components/motion/Reveal";
import { site, waLink } from "@/lib/site";
import { FacebookIcon, InstagramIcon, WhatsappIcon, YoutubeIcon } from "@/components/site/Icons";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact Kuber Maheshwari, Indore: ${site.phones.map((p) => p.display).join(", ")}. WhatsApp, call or send an enquiry.`,
};

export default function Contact() {
  return (
    <>
      <PageHeader kicker="संपर्क · Contact" title="Let's talk" italic="bhakti." />
      <section className="mx-auto max-w-[1500px] px-5 md:px-10">
        <div className="grid gap-px bg-ivory/10 md:grid-cols-3">
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
          <h2 className="font-display text-5xl leading-none md:text-6xl">
            Send a <span className="italic text-gold">message</span>
          </h2>
          <p className="mt-4 text-muted">We usually reply within a few hours.</p>
          <div className="mt-10">
            <EnquiryForm />
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
