import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import LiveVideo from "@/components/home/LiveVideo";
import YouTubeLite from "@/components/social/YouTubeLite";
import SocialFeed from "@/components/social/SocialFeed";
import { Reveal } from "@/components/motion/Reveal";
import { getVideos } from "@/lib/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Videos",
  description: "Watch Kuber Maheshwari live: bhajans, Sundarkand and stage performances.",
};

export default async function Videos() {
  const videos = await getVideos();
  return (
    <>
      <PageHeader kicker="वीडियो · Videos" hi="देखिए, और साथ में गाइए" title="Watch," italic="and sing along." />
      <LiveVideo />
      {videos.length > 0 && (
        <section className="mx-auto grid max-w-[1500px] gap-6 px-5 py-20 md:grid-cols-2 md:px-10">
          {videos.map((v, i) => (
            <Reveal key={v.id} delay={(i % 2) * 0.1}>
              <YouTubeLite id={v.youtubeId} title={v.title} />
              <p className="mt-4 font-display text-2xl">{v.title}</p>
            </Reveal>
          ))}
        </section>
      )}
      <SocialFeed limit={12} />
    </>
  );
}
