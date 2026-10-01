import Link from "next/link";
import { ParallaxImage, Reveal, SplitText } from "@/components/motion/Reveal";
import { ArrowIcon, WhatsappIcon } from "@/components/site/Icons";
import { waLink } from "@/lib/site";
import ChaupaiCard from "./ChaupaiCard";

const points = [
  ["संगीतमय पाठ", "श्री सुन्दरकाण्ड का सजीव संगीत के साथ पाठ।"],
  ["भावार्थ सहित", "हर प्रसंग का अर्थ सरल शब्दों में, ताकि हर श्रोता समझ सके।"],
  ["मंच का अनुभव", "वर्षों तक देश के बड़े भजन गायकों के साथ संगीतकार के रूप में सेवा।"],
  ["हर आयोजन के लिए", "घर, मंदिर, सोसायटी और सार्वजनिक मंच।"],
];

// The story of Sundarkand, in five moments.
const prasang = [
  ["समुद्र लंघन", "हनुमान जी का सौ योजन समुद्र पार करना"],
  ["लंका प्रवेश", "लंकिनी से भेंट और विभीषण जी से मिलन"],
  ["अशोक वाटिका", "माता सीता को श्री राम की मुद्रिका और संदेश"],
  ["लंका दहन", "रावण की सभा, और अपनी पूँछ से लंका दहन"],
  ["प्रभु को समाचार", "चूड़ामणि भेंट और माता सीता का संदेश"],
];

export default function SundarkandFeature() {
  return (
    <section className="relative overflow-hidden bg-maroon pb-20 pt-24 md:pb-28 md:pt-32">
      <div className="pointer-events-none absolute -right-40 top-10 font-hindi text-[40vw] leading-none text-night/15" aria-hidden>
        ॐ
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_40%_at_15%_20%,rgba(232,130,12,0.18),transparent_70%)]" />

      <div className="relative mx-auto max-w-[1500px] px-5 md:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* -------- left: title, verse + meaning, actions -------- */}
          <div className="flex flex-col">
            <p className="font-hindi text-lg text-gold-soft">विशेष प्रस्तुति</p>
            <SplitText as="h2" text="संगीतमय श्री सुन्दरकाण्ड" className="mt-4 block font-hindi text-5xl leading-[1.3] text-ivory md:text-7xl" />
            <Reveal delay={0.2}>
              <p className="mt-2 font-display text-2xl italic text-gold md:text-3xl">with bhavarth, the meaning in every verse</p>
            </Reveal>

            <Reveal delay={0.25} className="mt-10">
              <ChaupaiCard />
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/booking?type=Sundarkand"
                  className="shine inline-flex h-14 items-center gap-2 rounded-full bg-saffron px-8 font-hindi text-lg font-semibold text-night shadow-[0_14px_50px_-10px_rgba(232,130,12,0.9)] transition-transform hover:scale-[1.03]"
                >
                  सुन्दरकाण्ड बुक करें <ArrowIcon className="h-4 w-4" />
                </Link>
                <a
                  href={waLink("नमस्ते, मुझे संगीतमय श्री सुन्दरकाण्ड (भावार्थ सहित) के आयोजन के लिए जानकारी चाहिए।")}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-14 items-center gap-2 rounded-full border border-ivory/30 px-7 font-hindi text-lg text-ivory transition-colors hover:border-gold hover:text-gold"
                >
                  <WhatsappIcon className="h-5 w-5" /> व्हाट्सऐप पर पूछें
                </a>
              </div>
            </Reveal>
          </div>

          {/* -------- right: photo -------- */}
          <div className="lg:self-center">
            <div className="relative">
              <ParallaxImage
                src="/images/gallery/kuber-06.webp"
                alt="Kuber Maheshwari with folded hands"
                focus="50% 12%"
                className="aspect-[4/5] rounded-t-[999px] ring-2 ring-gold/40 lg:aspect-[5/6]"
              />
              <div className="absolute -left-3 bottom-10 rotate-[-4deg] rounded-2xl bg-saffron px-4 py-2 font-hindi text-base font-semibold text-night shadow-xl md:-left-6">
                जय श्री राम
              </div>
            </div>
          </div>
        </div>

        {/* -------- highlights: one row under both columns -------- */}
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-ivory/15 sm:grid-cols-2 lg:grid-cols-4">
          {points.map(([h, t], i) => (
            <Reveal key={h} delay={i * 0.08} className="h-full bg-[#5a1520] p-6">
              <p className="font-hindi text-2xl leading-[1.4] text-gold-soft">{h}</p>
              <p className="mt-2 font-hindi text-base leading-relaxed text-ivory/75">{t}</p>
            </Reveal>
          ))}
        </div>

        {/* -------- story path across the full width -------- */}
        <div className="mt-20">
          <Reveal>
            <p className="font-hindi text-lg text-gold-soft">कथा के प्रसंग</p>
            <h3 className="mt-2 font-hindi text-3xl leading-[1.4] text-ivory md:text-4xl">सुन्दरकाण्ड की यात्रा, पाँच पड़ावों में</h3>
          </Reveal>
          <ol className="relative mt-10 grid gap-4 md:grid-cols-5">
            <span className="absolute left-0 right-0 top-[27px] hidden h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent md:block" aria-hidden />
            {prasang.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.08}>
                <li className="relative flex gap-4 md:block">
                  <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gold/60 bg-[#3d0d16] font-display text-2xl text-saffron shadow-[0_0_30px_-6px_rgba(232,130,12,0.7)]">
                    {i + 1}
                  </span>
                  <div className="md:mt-5">
                    <p className="font-hindi text-xl leading-[1.5] text-ivory">{t}</p>
                    <p className="mt-1 font-hindi text-base leading-relaxed text-ivory/65">{d}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
