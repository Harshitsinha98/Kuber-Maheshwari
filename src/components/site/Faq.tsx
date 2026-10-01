import { Reveal } from "@/components/motion/Reveal";

export type FaqItem = { q: string; a: string };

/** सवाल-जवाब accordion + FAQPage structured data (shows as rich results in Google). */
export default function Faq({ title, items, kicker = "सवाल-जवाब" }: { title: string; items: FaqItem[]; kicker?: string }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Reveal>
        <p className="font-hindi text-lg text-saffron">{kicker}</p>
        <h2 className="mt-2 font-hindi text-3xl leading-[1.4] text-ivory md:text-5xl">{title}</h2>
      </Reveal>
      <div className="mt-10 space-y-3">
        {items.map((i, k) => (
          <Reveal key={i.q} delay={Math.min(k, 5) * 0.05}>
            <details className="group rounded-2xl border border-gold/20 bg-night-2/70 px-6 py-1 transition-colors open:border-gold/50 open:bg-[#241014]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 font-hindi text-lg leading-relaxed text-ivory md:text-xl">
                {i.q}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold transition-transform duration-300 group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="pb-5 font-hindi text-base leading-[1.9] text-ivory/75 md:text-lg">{i.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
