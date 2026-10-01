import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import WhatsAppFloat from "@/components/site/WhatsAppFloat";
import SmoothScroll from "@/components/motion/SmoothScroll";
import Cursor from "@/components/motion/Cursor";
import Preloader from "@/components/motion/Preloader";
import { site } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MusicGroup",
  name: "Kuber Maheshwari",
  alternateName: ["कुबेर माहेश्वरी", "Ankit Maheshwari"],
  genre: ["Bhajan", "Devotional", "Sundarkand", "Bhakti Fusion"],
  url: site.url,
  image: `${site.url}/images/gallery/kuber-25.webp`,
  telephone: site.phones.map((p) => p.tel),
  foundingLocation: { "@type": "Place", name: "Indore, Madhya Pradesh, India" },
  sameAs: Object.values(site.social),
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-[76px] md:pb-0 print:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SmoothScroll />
      <Cursor />
      <Preloader />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
