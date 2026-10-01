import { getTestimonials } from "@/lib/testimonials";
import { Reveal } from "@/components/motion/Reveal";

/** "भक्तों के अनुभव": hidden until the admin adds at least one real testimonial. */
export default async function Testimonials() {
  const list = (await getTestimonials()).slice(0, 9);
  if (!list.length) return null;
  return (
    <section className="relative overflow-hidden bg-ivory py-24 text-ink md:py-32">
      <div className="pointer-events-none absolute -left-24 -top-24 font-hindi text-[22rem] leading-none text-maroon/[0.06]" aria-hidden>
        “
      </div>
      <div className="relative mx-auto max-w-[1500px] px-5 md:px-10">
        <Reveal>
          <p className="font-hindi text-lg text-kumkum">भक्तों के अनुभव</p>
          <h2 className="mt-2 font-hindi text-4xl leading-[1.4] md:text-6xl">जिन्होंने सुना, उन्होंने कहा</h2>
        </Reveal>
        <div className="mt-12 columns-1 gap-5 md:columns-2 lg:columns-3">
          {list.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 0.08} className="mb-5 break-inside-avoid">
              <figure className="rounded-3xl border border-maroon/15 bg-white p-7 shadow-[0_20px_60px_-35px_rgba(110,26,38,0.45)]">
                <div className="font-display text-6xl leading-[0.5] text-saffron" aria-hidden>
                  “
                </div>
                <blockquote className="mt-4 font-hindi text-lg leading-[1.85] text-ink/85">{t.text}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-maroon/10 pt-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-maroon font-hindi text-lg text-ivory">{t.name.trim().charAt(0)}</span>
                  <span className="leading-tight">
                    <span className="block font-semibold">{t.name}</span>
                    <span className="block text-sm text-ink/55">{[t.place, t.occasion].filter(Boolean).join(" · ")}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
