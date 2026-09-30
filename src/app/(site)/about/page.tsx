import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/site/PageHeader";
import { ParallaxImage, Reveal } from "@/components/motion/Reveal";
import { journey, site } from "@/lib/site";
import Tracked from "@/components/site/Tracked";

export const metadata: Metadata = {
  title: "About",
  description:
    "The journey of Kuber Maheshwari (Ankit Maheshwari) from Indore: from childhood kirtans and synthesizer tours with India's great bhajan singers to Sangeetmay Shri Sundarkand.",
};

export default function About() {
  return (
    <>
      <PageHeader
        kicker="परिचय · About"
        title="A life tuned"
        italic="to bhakti."
        intro="Born in Indore, a B.Com graduate by education and a musician by calling. Kuber Maheshwari's music grew out of the kirtans he attended with his father, and was refined on stages all across India."
      />

      <section className="mx-auto grid max-w-[1500px] gap-6 px-5 md:grid-cols-12 md:px-10">
        <ParallaxImage src="/images/gallery/kuber-18.webp" alt="Kuber Maheshwari" className="aspect-[4/5] md:col-span-7" priority />
        <div className="flex flex-col justify-end gap-6 md:col-span-5">
          <ParallaxImage src="/images/gallery/kuber-08.webp" alt="At the harmonium" className="aspect-[4/3]" strength={16} />
          <Reveal>
            <dl className="grid grid-cols-2 gap-6 border-t border-ivory/10 pt-6 text-sm">
              {[
                ["Stage name", site.nameHi],
                ["Birthplace", "Indore"],
                ["Education", "B.Com. Graduate"],
                ["Studio", site.studio],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] uppercase tracking-[0.3em] text-muted">{k}</dt>
                  <dd className={`mt-1 text-lg text-ivory ${/[\u0900-\u097F]/.test(v) ? "font-hindi" : "font-display"}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-28 md:px-10 md:py-40">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.35em] text-gold"><Tracked text="यात्रा · The journey" /></p>
        </Reveal>
        <ol className="relative mt-14">
          <span className="absolute left-[7px] top-0 h-full w-px bg-gradient-to-b from-gold/60 via-gold/20 to-transparent md:left-[calc(25%+7px)]" />
          {journey.map((j, i) => (
            <li key={j.year} className="relative grid gap-4 pb-20 pl-10 md:grid-cols-4 md:pl-0">
              <span className="absolute left-0 top-3 h-[15px] w-[15px] rounded-full border border-gold bg-night md:left-[25%]" />
              <Reveal className="md:pr-12 md:text-right">
                <p className={`${/[\u0900-\u097F]/.test(j.year) ? "font-hindi" : "font-display"} text-5xl text-gold md:text-6xl`}>{j.year}</p>
              </Reveal>
              <Reveal delay={0.1} className="md:col-span-3 md:pl-16">
                <h3 className="font-hindi text-3xl text-ivory md:text-4xl">{j.title}</h3>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ivory/70">{j.text}</p>
                {i === 2 && (
                  <p className="mt-4 max-w-2xl text-sm italic text-muted">
                    “इतने समय में मैने अच्छे-बुरे, छोटे-बड़े, सिद्ध-प्रसिद्ध बहुत से गायक गायिकाओं को देखा, सुना और समझा।”
                  </p>
                )}
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-ivory py-28 text-ink md:py-36">
        <div className="mx-auto grid max-w-[1500px] items-center gap-12 px-5 md:grid-cols-2 md:px-10">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-kumkum"><Tracked text="विशेष" /></p>
            <h2 className="mt-5 font-hindi text-5xl leading-tight md:text-6xl">संगीतमय श्री सुन्दरकाण्ड</h2>
            <p className="mt-2 font-display text-3xl italic text-maroon">प्रस्तुति, भावार्थ सहित</p>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-ink/70">
              His signature presentation: Shri Sundarkand sung to music, with its meaning explained so that every listener, young or old, feels the story of Hanuman ji.
            </p>
            <Link href="/booking?type=Sundarkand" className="mt-10 inline-flex h-14 items-center rounded-full bg-maroon px-8 text-sm font-semibold uppercase tracking-[0.16em] text-ivory hover:bg-kumkum">
              Book a Sundarkand
            </Link>
          </Reveal>
          <ParallaxImage src="/images/gallery/kuber-27.webp" alt="Kuber Maheshwari" className="aspect-[4/5]" />
        </div>
      </section>
    </>
  );
}
