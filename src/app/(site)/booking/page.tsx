import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import EnquiryForm from "@/components/site/EnquiryForm";
import { Reveal, SplitText } from "@/components/motion/Reveal";
import { ArrowIcon, WhatsappIcon } from "@/components/site/Icons";
import { site, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book Kuber Maheshwari for your event",
  description: "Invite Kuber Maheshwari for Sundarkand, Bhajan Sandhya, Bhajan Clubbing, Jagran, Kirtan or weddings. Send an enquiry, call or WhatsApp.",
};

// Only facts from Kuber ji's own profile.
const facts = [
  ["2008 से", "संगीत सेवा"],
  ["भावार्थ सहित", "संगीतमय सुन्दरकाण्ड"],
  ["देशभर में", "मंचीय प्रस्तुतियाँ"],
];

const steps = [
  ["01", "जानकारी भेजें", "आयोजन का प्रकार, तारीख और शहर बताइए।"],
  ["02", "हमारा कॉल", "टीम आपसे संपर्क करके सारी बातें तय करेगी।"],
  ["03", "तारीख पक्की", "बुकिंग कन्फर्म, और आपका आयोजन भक्तिमय।"],
];

const occasions = ["संगीतमय सुन्दरकाण्ड", "भजन संध्या", "भजन क्लबिंग", "भक्ति फ्यूज़न", "माता जागरण", "श्याम कीर्तन", "वैवाहिक आयोजन"];

export default async function Booking({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2a0810] via-night to-night pt-28 md:pt-32">
        <div className="toran absolute inset-x-0 top-20 z-10 opacity-90 md:top-24" aria-hidden />
        <div className="flame-glow pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative mx-auto grid max-w-[1500px] items-center gap-12 px-5 pb-20 pt-12 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28">
          <div>
            <Reveal>
              <p className="font-hindi text-lg text-saffron">आमंत्रण · Booking</p>
            </Reveal>
            <SplitText as="h1" immediate text="अपने आयोजन को बनाइए भक्तिमय" className="mt-4 block font-hindi text-5xl leading-[1.35] text-ivory md:text-7xl" />
            <Reveal delay={0.3}>
              <p className="mt-4 font-display text-2xl italic text-gold md:text-3xl">Invite Kuber ji to your event</p>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/75">
                सुन्दरकाण्ड, भजन संध्या, जागरण या पारिवारिक आयोजन: अपनी तारीख और शहर बताइए, बाकी हम संभाल लेंगे।
              </p>
            </Reveal>
            <Reveal delay={0.4}>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#enquiry" className="shine inline-flex h-14 items-center rounded-full bg-saffron px-8 font-hindi text-lg font-semibold text-night shadow-[0_14px_50px_-10px_rgba(232,130,12,0.9)]">
                  अभी बुक करें
                </a>
                <a href={waLink()} target="_blank" rel="noopener" className="inline-flex h-14 items-center gap-2 rounded-full bg-[#1f9d55] px-7 font-hindi text-lg font-semibold text-white">
                  <WhatsappIcon className="h-5 w-5" /> व्हाट्सऐप करें
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.5}>
              <dl className="mt-12 grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-2xl bg-gold/20">
                {facts.map(([a, b]) => (
                  <div key={a} className="bg-night/80 px-4 py-4 backdrop-blur">
                    <dt className="font-hindi text-xl leading-snug text-gold md:text-2xl">{a}</dt>
                    <dd className="mt-1 font-hindi text-sm text-ivory/70">{b}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={0.2} className="relative mx-auto w-full max-w-[460px]">
            {/* मेहराब (arch) frame with a gold halo */}
            <div className="absolute -inset-6 rounded-t-full bg-[radial-gradient(closest-side,rgba(232,130,12,0.45),transparent)] blur-2xl" aria-hidden />
            <div className="relative overflow-hidden rounded-t-full border-[3px] border-gold/70 p-2 shadow-[0_40px_120px_-30px_rgba(232,130,12,0.6)]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-t-full">
                <Image src="/images/gallery/kuber-06.webp" alt="Kuber Maheshwari, namaste" fill priority quality={90} sizes="(max-width:1024px) 90vw, 460px" className="object-cover object-[50%_20%]" />
                <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent" />
              </div>
            </div>
            <div className="absolute -left-4 bottom-16 rotate-[-4deg] rounded-2xl bg-saffron px-4 py-2 font-hindi text-base font-semibold text-night shadow-xl md:-left-10">
              संगीतमय सुन्दरकाण्ड
            </div>
            <div className="absolute -right-3 top-24 rotate-[5deg] rounded-2xl bg-ivory px-4 py-2 font-hindi text-base font-semibold text-maroon shadow-xl md:-right-8">
              भावार्थ सहित
            </div>
          </Reveal>
        </div>

        {/* occasions strip */}
        <div className="relative border-y border-gold/20 bg-maroon/60 py-4">
          <div className="marquee flex w-max gap-10" style={{ ["--dur" as string]: "35s" }}>
            {[0, 1].map((k) => (
              <div key={k} className="flex gap-10" aria-hidden={k === 1}>
                {[...occasions, ...occasions].map((o, i) => (
                  <span key={i} className="flex items-center gap-10 whitespace-nowrap font-hindi text-xl text-gold-soft">
                    {o}
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-saffron" fill="currentColor" aria-hidden>
                      <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0Z" />
                    </svg>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="mx-auto max-w-[1500px] px-5 py-20 md:px-10">
        <Reveal>
          <h2 className="font-hindi text-3xl leading-[1.4] text-ivory md:text-4xl">बुकिंग कैसे होती है</h2>
        </Reveal>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 0.1}>
              <li className="h-full rounded-3xl border border-gold/20 bg-gradient-to-br from-[#241014] to-night p-7">
                <div className="font-display text-5xl text-saffron">{n}</div>
                <h3 className="mt-3 font-hindi text-2xl leading-[1.4] text-ivory">{t}</h3>
                <p className="mt-2 font-hindi text-base leading-relaxed text-ivory/65">{d}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------- Form + contact ---------- */}
      <section id="enquiry" className="mx-auto grid max-w-[1500px] scroll-mt-24 gap-8 px-5 pb-32 md:px-10 lg:grid-cols-[1.35fr_1fr]">
        <Reveal>
          <div className="relative rounded-[28px] bg-gradient-to-br from-saffron/60 via-gold/30 to-maroon/60 p-px">
            <div className="rounded-[27px] bg-night-2 p-6 md:p-10">
              <h2 className="font-hindi text-3xl leading-[1.4] text-ivory md:text-4xl">आयोजन की जानकारी भेजें</h2>
              <p className="mt-1 text-sm text-muted">We usually call back within a few hours.</p>
              <div className="mt-8">
                <EnquiryForm defaultType={type} />
              </div>
            </div>
          </div>
        </Reveal>

        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <div className="relative overflow-hidden rounded-[28px] ring-1 ring-gold/25">
              <div className="relative aspect-[3/2]">
                <Image src="/images/gallery/kuber-37.webp" alt="Kuber Maheshwari singing" fill quality={90} sizes="(max-width:1024px) 90vw, 560px" className="object-cover object-[45%_30%]" />
                <div className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent" />
                <p className="absolute bottom-4 left-5 font-hindi text-2xl text-ivory">सीधे बात करें</p>
              </div>
              <div className="space-y-3 bg-night-2 p-5">
                {site.phones.map((p, i) => (
                  <div key={p.tel} className="flex items-center justify-between gap-3 rounded-2xl border border-ivory/10 px-4 py-3">
                    <a href={`tel:${p.tel}`} className="font-display text-2xl text-ivory hover:text-gold">
                      {p.display}
                    </a>
                    <a href={waLink(undefined, i)} target="_blank" rel="noopener" aria-label={`WhatsApp ${p.display}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1f9d55] text-white">
                      <WhatsappIcon className="h-5 w-5" />
                    </a>
                  </div>
                ))}
                <p className="pt-1 text-sm text-muted">
                  सार्वजनिक कार्यक्रम के टिकट चाहिए?{" "}
                  <Link href="/events" className="inline-flex items-center gap-1 font-hindi text-gold underline-offset-4 hover:underline">
                    आगामी कार्यक्रम देखें <ArrowIcon className="h-3.5 w-3.5" />
                  </Link>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
