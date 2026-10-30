import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/site/PageHeader";
import { ParallaxImage, Reveal } from "@/components/motion/Reveal";
import { WhatsappIcon } from "@/components/site/Icons";
import { blurFor } from "@/lib/photos";
import { services, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services: Sundarkand, Bhajan Sandhya, Bhajan Clubbing, Bhakti Fusion",
  description:
    "Book Kuber Maheshwari for Musical Sundarkand with bhavarth, Bhajan Sandhya, Bhajan Clubbing, Bhakti Fusion, Mata Jagran, Shyam Kirtan, weddings and family functions in Indore and across India.",
};

type Service = (typeof services)[number];

const num = (s: Service) => String(services.indexOf(s) + 1).padStart(2, "0");
const bySlug = (slug: string) => services.find((s) => s.slug === slug)!;
const blurProps = (src: string) => {
  const b = blurFor(src);
  return b ? { placeholder: "blur" as const, blurDataURL: b } : {};
};

function Actions({ s, light = false }: { s: Service; light?: boolean }) {
  return (
    <div className="mt-7 flex flex-wrap gap-3">
      <Link
        href={`/booking?type=${encodeURIComponent(s.en)}`}
        className="inline-flex h-12 items-center rounded-full bg-saffron px-6 text-xs font-semibold uppercase tracking-[0.16em] text-night transition-colors hover:bg-marigold"
      >
        Enquire
      </Link>
      <a
        href={waLink(`नमस्ते, मुझे ${s.hi} (${s.en}) के लिए जानकारी चाहिए।`)}
        target="_blank"
        rel="noopener"
        className={`inline-flex h-12 items-center gap-2 rounded-full border px-6 text-xs uppercase tracking-[0.16em] transition-colors ${
          light ? "border-ink/20 text-ink hover:border-maroon hover:text-maroon" : "border-ivory/20 text-ivory hover:border-gold hover:text-gold"
        }`}
      >
        <WhatsappIcon className="h-4 w-4" /> WhatsApp
      </a>
    </div>
  );
}

/** Portrait card used in the staggered two-column rows. */
function Card({ s, offset = false }: { s: Service; offset?: boolean }) {
  return (
    <article id={s.slug} className={`scroll-mt-28 ${offset ? "md:mt-32" : ""}`}>
      <div className="group relative">
        <ParallaxImage src={s.image} alt={`Kuber Maheshwari: ${s.en}`} focus={s.focus} sizes="(max-width: 768px) 100vw, 45vw" className="aspect-[4/5] rounded-[28px]" />
        <span className="pointer-events-none absolute left-5 top-5 rounded-full bg-night/75 px-4 py-1.5 font-display text-lg leading-none tracking-wider text-gold ring-1 ring-gold/40 backdrop-blur">{num(s)}</span>
      </div>
      <Reveal>
        <h2 className="mt-8 font-hindi text-4xl leading-[1.35] text-ivory md:text-5xl">{s.hi}</h2>
        <p className="mt-1 font-display text-2xl italic text-gold md:text-3xl">{s.en}</p>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-ivory/70">{s.desc}</p>
        <Actions s={s} />
      </Reveal>
    </article>
  );
}

export default function Services() {
  const sundarkand = bySlug("sundarkand");
  const fusion = bySlug("bhakti-fusion");
  const rowA = [bySlug("bhajan-sandhya"), bySlug("bhajan-clubbing")];
  const rowB = [bySlug("jagran-kirtan"), bySlug("weddings")];

  return (
    <>
      <PageHeader
        kicker="सेवाएँ · Services"
        hi="हर पावन अवसर का संगीत"
        title="Music for every"
        italic="sacred moment."
        intro="From an intimate Sundarkand at home to a festival stage with thousands singing along, every performance is prepared for its occasion."
      />

      {/* quick jump to each service */}
      <nav aria-label="Services" className="mx-auto -mt-6 max-w-[1500px] px-5 pb-14 md:px-10">
        <ul className="flex flex-wrap gap-2">
          {services.map((s) => (
            <li key={s.slug}>
              <a href={`#${s.slug}`} className="inline-flex items-center gap-2 rounded-full border border-ivory/15 px-4 py-2 font-hindi text-base text-ivory/80 transition-colors hover:border-gold hover:text-gold">
                <span className="font-display text-xs text-gold">{num(s)}</span>
                {s.hi}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ---------- Signature: Sundarkand, full-width ---------- */}
      <section id={sundarkand.slug} className="mx-auto max-w-[1500px] scroll-mt-28 px-5 md:px-10">
        <div className="relative overflow-hidden rounded-[32px] bg-night-2 ring-1 ring-gold/25">
          <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]">
            <Image
              src={sundarkand.image}
              alt="Kuber Maheshwari performing Sangeetmay Shri Sundarkand on stage"
              fill
              priority
              quality={90}
              sizes="(max-width: 1500px) 100vw, 1500px"
              className="object-cover"
              style={{ objectPosition: sundarkand.focus }}
              {...blurProps(sundarkand.image)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-night-2 via-transparent to-transparent lg:bg-gradient-to-r lg:from-night/95 lg:via-night/55 lg:to-transparent" />
          </div>
          <div className="relative p-6 md:p-10 lg:absolute lg:inset-y-0 lg:left-0 lg:flex lg:max-w-[52%] lg:flex-col lg:justify-center lg:p-12">
            <Reveal>
              <div className="flex items-center gap-3">
                <span className="font-display text-xl tracking-wider text-gold">{num(sundarkand)}</span>
                <span className="rounded-full bg-saffron px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-night">Signature</span>
              </div>
              <h2 className="mt-4 font-hindi text-4xl leading-[1.35] text-ivory md:text-6xl">{sundarkand.hi}</h2>
              <p className="mt-1 font-display text-2xl italic text-gold md:text-4xl">
                {sundarkand.en}
                {sundarkand.note && <span className="ml-3 font-hindi text-lg not-italic text-gold-soft md:text-xl">· {sundarkand.note}</span>}
              </p>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ivory/80 md:text-lg">{sundarkand.desc}</p>
              <Actions s={sundarkand} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Bhajan Sandhya + Bhajan Clubbing ---------- */}
      <section className="mx-auto grid max-w-[1500px] gap-16 px-5 py-24 md:grid-cols-2 md:gap-12 md:px-10 md:py-32">
        {rowA.map((s, i) => (
          <Card key={s.slug} s={s} offset={i === 1} />
        ))}
      </section>

      {/* ---------- Bhakti Fusion on ivory, for contrast ---------- */}
      <section id={fusion.slug} className="scroll-mt-20 bg-ivory py-20 text-ink md:py-28">
        <div className="mx-auto grid max-w-[1500px] items-center gap-10 px-5 md:grid-cols-12 md:px-10">
          <ParallaxImage src={fusion.image} alt={`Kuber Maheshwari: ${fusion.en}`} focus={fusion.focus} sizes="(max-width: 768px) 100vw, 55vw" className="aspect-square rounded-[28px] md:col-span-6" />
          <Reveal className="md:col-span-5 md:col-start-8">
            <p className="font-display text-xl tracking-wider text-kumkum">{num(fusion)}</p>
            <h2 className="mt-3 font-hindi text-4xl leading-[1.35] md:text-6xl">{fusion.hi}</h2>
            <p className="mt-1 font-display text-2xl italic text-maroon md:text-4xl">{fusion.en}</p>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/70">{fusion.desc}</p>
            <Actions s={fusion} light />
          </Reveal>
        </div>
      </section>

      {/* ---------- Jagran & Kirtan + Weddings ---------- */}
      <section className="mx-auto grid max-w-[1500px] gap-16 px-5 py-24 md:grid-cols-2 md:gap-12 md:px-10 md:py-32">
        {rowB.map((s, i) => (
          <Card key={s.slug} s={s} offset={i === 1} />
        ))}
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="mx-auto max-w-[1500px] px-5 pb-28 md:px-10">
        <div className="grid overflow-hidden rounded-[32px] bg-gradient-to-br from-[#2a0810] via-night-2 to-night ring-1 ring-gold/25 lg:grid-cols-2">
          <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[460px]">
            <Image
              src="/images/gallery/kuber-15.webp"
              alt="Kuber Maheshwari with open arms"
              fill
              quality={90}
              sizes="(max-width: 1024px) 100vw, 750px"
              className="object-cover object-[50%_30%]"
              {...blurProps("/images/gallery/kuber-15.webp")}
            />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-12">
            <Reveal>
              <p className="font-hindi text-lg text-saffron">आमंत्रण</p>
              <h2 className="mt-2 font-hindi text-4xl leading-[1.35] text-ivory md:text-5xl">आपका आयोजन, हमारी सेवा</h2>
              <p className="mt-2 max-w-md text-base leading-relaxed text-ivory/75 md:text-lg">Tell us the occasion, date and city. The team will call you back and plan the rest.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/booking" className="inline-flex h-12 items-center rounded-full bg-saffron px-6 text-xs font-semibold uppercase tracking-[0.16em] text-night hover:bg-marigold">
                  Book now
                </Link>
                <a href={waLink()} target="_blank" rel="noopener" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1f9d55] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                  <WhatsappIcon className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
