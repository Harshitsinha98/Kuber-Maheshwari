import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/site/PageHeader";
import EnquiryForm from "@/components/site/EnquiryForm";
import { ParallaxImage, Reveal } from "@/components/motion/Reveal";
import { site, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book Kuber Maheshwari for your event",
  description: "Invite Kuber Maheshwari for Sundarkand, Bhajan Sandhya, Bhajan Clubbing, Jagran, Kirtan or weddings. Send an enquiry, call or WhatsApp.",
};

export default async function Booking({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return (
    <>
      <PageHeader kicker="आमंत्रण · Booking" title="Invite Kuber ji" italic="to your event." />
      <section className="mx-auto grid max-w-[1500px] gap-16 px-5 pb-32 md:px-10 lg:grid-cols-[1.3fr_1fr]">
        <Reveal>
          <EnquiryForm defaultType={type} />
        </Reveal>
        <div className="space-y-8">
          <ParallaxImage src="/images/gallery/kuber-30.webp" alt="Kuber Maheshwari, namaste" className="aspect-[4/5]" />
          <Reveal>
            <div className="space-y-3 border-t border-ivory/10 pt-6">
              {site.phones.map((p, i) => (
                <div key={p.tel} className="flex items-center justify-between">
                  <a href={`tel:${p.tel}`} className="font-display text-3xl hover:text-gold">
                    {p.display}
                  </a>
                  <a href={waLink(undefined, i)} target="_blank" rel="noopener" className="text-xs uppercase tracking-[0.2em] text-[#4ade80] hover:underline">
                    WhatsApp
                  </a>
                </div>
              ))}
              <p className="pt-3 text-sm text-muted">
                Looking for tickets to a public event? <Link href="/events" className="text-gold underline-offset-4 hover:underline">See upcoming events →</Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
