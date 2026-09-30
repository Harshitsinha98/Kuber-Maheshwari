import Link from "next/link";
import { ParallaxImage, Reveal, SplitText } from "@/components/motion/Reveal";
import Tracked from "@/components/site/Tracked";

const points = [
  ["संगीतमय पाठ", "Shri Sundarkand presented as a live musical performance."],
  ["भावार्थ सहित", "The meaning of the verses explained along the way, so every listener understands."],
  ["सजीव संगीत", "Live music backed by years on stage as a musician himself."],
  ["हर आयोजन के लिए", "Homes, temples, societies and public stages."],
];

export default function SundarkandFeature() {
  return (
    <section className="relative overflow-hidden bg-maroon py-28 md:py-40">
      <div className="pointer-events-none absolute -right-40 top-10 font-hindi text-[40vw] leading-none text-night/15" aria-hidden>
        ॐ
      </div>
      <div className="relative mx-auto grid max-w-[1500px] gap-16 px-5 md:px-10 lg:grid-cols-2">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs uppercase tracking-[0.35em] text-gold-soft"><Tracked text="(03) विशेष प्रस्तुति" /></p>
          <SplitText as="h2" text="संगीतमय श्री सुन्दरकाण्ड" className="mt-6 block font-hindi text-5xl leading-[1.15] text-ivory md:text-7xl" />
          <Reveal delay={0.2}>
            <p className="mt-3 font-display text-3xl italic text-gold md:text-4xl">with bhavarth, the meaning in every verse</p>
          </Reveal>
          <Reveal delay={0.3}>
            <blockquote className="mt-12 border-l border-gold/50 pl-6 font-hindi text-xl leading-relaxed text-ivory/85 md:text-2xl">
              जामवंत के बचन सुहाए। सुनि हनुमंत हृदय अति भाए॥
            </blockquote>
          </Reveal>
          <Reveal delay={0.4}>
            <Link
              href="/booking?type=Sundarkand"
              className="mt-12 inline-flex h-14 items-center rounded-full bg-ivory px-8 text-sm font-semibold uppercase tracking-[0.16em] text-maroon transition-colors hover:bg-gold hover:text-night"
            >
              Book a Sundarkand
            </Link>
          </Reveal>
        </div>

        <div className="space-y-6">
          <ParallaxImage src="/images/gallery/kuber-06.webp" alt="Kuber Maheshwari with folded hands" className="aspect-[4/5]" />
          <div className="grid gap-px bg-ivory/15 sm:grid-cols-2">
            {points.map(([h, t], i) => (
              <Reveal key={h} delay={i * 0.08} className="bg-maroon p-7">
                <p className="font-hindi text-2xl text-gold-soft">{h}</p>
                <p className="mt-3 text-sm leading-relaxed text-ivory/75">{t}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
