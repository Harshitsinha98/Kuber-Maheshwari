import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/site/PageHeader";
import { ParallaxImage, Reveal } from "@/components/motion/Reveal";
import { services, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services: Sundarkand, Bhajan Sandhya, Bhajan Clubbing, Bhakti Fusion",
  description:
    "Book Kuber Maheshwari for Musical Sundarkand with bhavarth, Bhajan Sandhya, Bhajan Clubbing, Bhakti Fusion, Mata Jagran, Shyam Kirtan, weddings and studio recording in Indore and across India.",
};

export default function Services() {
  return (
    <>
      <PageHeader
        kicker="सेवाएँ · Services"
        hi="हर पावन अवसर का संगीत"
        title="Music for every"
        italic="sacred moment."
        intro="From an intimate Sundarkand at home to a festival stage with thousands singing along, every performance is prepared for its occasion."
      />
      <div className="mx-auto max-w-[1500px] px-5 pb-20 md:px-10">
        {services.map((s, i) => (
          <section id={s.slug} key={s.slug} className="grid scroll-mt-28 items-center gap-10 border-t border-ivory/10 py-20 md:grid-cols-12 md:py-28">
            <div className={`md:col-span-6 ${i % 2 ? "md:order-2 md:col-start-7" : ""}`}>
              <ParallaxImage src={s.image} alt={s.en} className="aspect-[5/4]" />
            </div>
            <div className={`md:col-span-5 ${i % 2 ? "md:order-1" : "md:col-start-8"}`}>
              <Reveal>
                <p className="font-display text-lg text-gold">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="mt-4 font-hindi text-4xl leading-tight text-ivory md:text-5xl">{s.hi}</h2>
                <p className="mt-2 font-display text-3xl italic text-gold">{s.en}</p>
                {s.note && <p className="mt-1 font-hindi text-muted">({s.note})</p>}
                <p className="mt-6 text-lg leading-relaxed text-ivory/70">{s.desc}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={`/booking?type=${encodeURIComponent(s.en)}`} className="inline-flex h-12 items-center rounded-full bg-saffron px-6 text-xs font-semibold uppercase tracking-[0.16em] text-night hover:bg-marigold">
                    Enquire
                  </Link>
                  <a
                    href={waLink(`नमस्ते, मुझे ${s.hi} (${s.en}) के लिए जानकारी चाहिए।`)}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex h-12 items-center rounded-full border border-ivory/20 px-6 text-xs uppercase tracking-[0.16em] text-ivory hover:border-gold hover:text-gold"
                  >
                    WhatsApp
                  </a>
                </div>
              </Reveal>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
