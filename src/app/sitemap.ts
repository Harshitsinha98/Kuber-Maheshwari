import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getUpcomingEvents } from "@/lib/queries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/about", "/services", "/events", "/gallery", "/videos", "/booking", "/contact"].map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const events = (await getUpcomingEvents(100)).map((e) => ({ url: `${site.url}/events/${e.slug}`, changeFrequency: "daily" as const, priority: 0.9 }));
  return [...pages, ...events];
}
