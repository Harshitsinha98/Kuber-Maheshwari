import Link from "next/link";
import { Counter, ParallaxImage, Reveal, ScrollFillText } from "@/components/motion/Reveal";
import { ArrowIcon } from "@/components/site/Icons";
import Tracked from "@/components/site/Tracked";

export default function Intro() {
  const years = new Date().getFullYear() - 2008;
  return (
    <section className="relative mx-auto max-w-[1500px] px-5 py-28 md:px-10 md:py-40">
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-gold"><Tracked text="(01) परिचय" /></p>
          </Reveal>
        </div>
        <div className="lg:col-span-9">
          <ScrollFillText
            className="font-display text-[2.1rem] leading-[1.12] text-ivory md:text-6xl md:leading-[1.08]"
            text="From accompanying his father to kirtans as a child, to playing synthesizer across India for the country's most loved bhajan singers, Kuber Maheshwari now brings Shri Sundarkand to life in his own voice, with its meaning explained."
          />
          <div className="mt-20 grid grid-cols-1 gap-10 border-t border-ivory/10 pt-10 sm:grid-cols-3">
            <Reveal>
              <div className="font-display text-6xl text-gold md:text-7xl">
                <Counter to={years} suffix="+" />
              </div>
              <p className="mt-2 text-sm text-muted">years in devotional music, since 2008</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="font-display text-6xl text-gold md:text-7xl">2014–18</div>
              <p className="mt-2 text-sm text-muted">touring India with legendary bhajan singers</p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="font-display text-6xl text-gold md:text-7xl">
                <Counter to={2018} group={false} />
              </div>
              <p className="mt-2 text-sm text-muted">performing as a bhajan singer in his own right</p>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="mt-28 grid items-end gap-6 md:grid-cols-12">
        <ParallaxImage src="/images/gallery/kuber-23.webp" alt="Kuber Maheshwari portrait" focus="55% 30%" className="aspect-[4/5] md:col-span-5" />
        <div className="md:col-span-4 md:col-start-7">
          <ParallaxImage src="/images/gallery/kuber-12.webp" alt="Kuber Maheshwari at the keyboard" className="aspect-square" strength={18} />
          <Reveal>
            <Link href="/about" className="group mt-8 inline-flex items-center gap-4 text-sm uppercase tracking-[0.2em] text-ivory" data-cursor="Read">
              <span className="relative">
                Read his journey
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left bg-gold transition-transform duration-500 group-hover:scale-x-0" />
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 text-gold transition-all duration-500 group-hover:rotate-45 group-hover:bg-gold group-hover:text-night">
                <ArrowIcon className="h-4 w-4" />
              </span>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
