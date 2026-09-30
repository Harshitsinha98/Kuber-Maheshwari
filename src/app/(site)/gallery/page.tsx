import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import { getGallery } from "@/lib/queries";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos of Kuber Maheshwari: live bhajan sandhya, Sundarkand, stage shows and portraits.",
};

export default async function Gallery() {
  const images = await getGallery();
  return (
    <>
      <PageHeader kicker="झलकियाँ · Gallery" title="Moments" italic="of devotion." />
      <section className="px-3 pb-32 md:px-6">
        <GalleryGrid images={images} />
      </section>
    </>
  );
}
