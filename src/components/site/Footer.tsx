import Link from "next/link";
import { site, waLink } from "@/lib/site";
import { Magnetic } from "@/components/motion/Reveal";
import { InstagramIcon, FacebookIcon, YoutubeIcon, WhatsappIcon } from "./Icons";
import Tracked from "@/components/site/Tracked";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-ivory/10 bg-night pt-24">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gold"><Tracked text="अपने आयोजन को भक्तिमय बनाइए" /></p>
            <h2 className="mt-6 font-display text-5xl leading-[0.95] text-ivory md:text-7xl">
              Let&apos;s create an evening
              <br />
              <span className="italic text-gold">they&apos;ll remember.</span>
            </h2>
            <div className="mt-10 flex flex-wrap gap-4">
              <Magnetic>
                <Link
                  href="/booking"
                  className="inline-flex h-14 items-center rounded-full bg-saffron px-8 text-sm font-semibold uppercase tracking-[0.16em] text-night transition-colors hover:bg-marigold"
                >
                  Send an enquiry
                </Link>
              </Magnetic>
              <Magnetic>
                <a
                  href={waLink()}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-14 items-center gap-3 rounded-full border border-ivory/20 px-8 text-sm uppercase tracking-[0.16em] text-ivory hover:border-gold hover:text-gold"
                >
                  <WhatsappIcon className="h-5 w-5" /> WhatsApp
                </a>
              </Magnetic>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm">
            <div>
              <h3 className="mb-5 text-xs uppercase tracking-[0.3em] text-muted">Explore</h3>
              <ul className="space-y-3 text-ivory/80">
                {[
                  ["About", "/about"],
                  ["Services", "/services"],
                  ["Events & Tickets", "/events"],
                  ["Gallery", "/gallery"],
                  ["Videos", "/videos"],
                  ["Contact", "/contact"],
                ].map(([l, h]) => (
                  <li key={h}>
                    <Link href={h} className="hover:text-gold">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-5 text-xs uppercase tracking-[0.3em] text-muted">Call</h3>
              <ul className="space-y-3 text-ivory/80">
                {site.phones.map((p) => (
                  <li key={p.tel}>
                    <a href={`tel:${p.tel}`} className="hover:text-gold">
                      {p.display}
                    </a>
                  </li>
                ))}
                <li className="pt-2 text-muted">{site.city}</li>
                <li className="text-muted">{site.studio}</li>
              </ul>
              <div className="mt-6 flex gap-3">
                {[
                  [site.social.instagram, InstagramIcon, "Instagram"],
                  [site.social.facebook, FacebookIcon, "Facebook"],
                  [site.social.youtube, YoutubeIcon, "YouTube"],
                ].map(([href, Icon, label]) => {
                  const I = Icon as typeof InstagramIcon;
                  return (
                    <a
                      key={label as string}
                      href={href as string}
                      target="_blank"
                      rel="noopener"
                      aria-label={label as string}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 text-ivory/70 transition hover:border-gold hover:text-gold"
                    >
                      <I className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 select-none overflow-hidden pb-[2vw]">
          <p className="whitespace-nowrap text-center font-hindi text-[16vw] leading-[1.4] text-outline md:text-[15vw]" aria-hidden>
            कुबेर माहेश्वरी
          </p>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-ivory/10 py-8 pb-24 text-xs text-muted md:flex-row md:pb-8 md:pr-24">
          <span>© {new Date().getFullYear()} Kuber Maheshwari · {site.studio}</span>
          <span className="font-hindi">॥ सियावर रामचन्द्र की जय ॥</span>
        </div>
      </div>
    </footer>
  );
}
