import { prisma, safe } from "./prisma";
import galleryFallback from "@/data/gallery.json";

export type EventCard = {
  id: string;
  slug: string;
  title: string;
  category: string;
  startsAt: string;
  venueName: string;
  city: string;
  posterUrl: string | null;
  fromPrice: number | null;
  status: string;
};

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  startsAt: true,
  venueName: true,
  city: true,
  posterUrl: true,
  status: true,
  ticketTypes: { select: { price: true } },
} as const;

type Row = { ticketTypes: { price: number }[]; startsAt: Date } & Omit<EventCard, "fromPrice" | "startsAt">;

const toCard = (e: Row): EventCard => ({
  ...e,
  startsAt: e.startsAt.toISOString(),
  fromPrice: e.ticketTypes.length ? Math.min(...e.ticketTypes.map((t) => t.price)) : null,
});

export const getUpcomingEvents = (take = 20) =>
  safe(
    async () =>
      (
        await prisma.event.findMany({
          where: { status: { in: ["PUBLISHED", "CANCELLED"] }, startsAt: { gte: new Date(Date.now() - 6 * 3600e3) } },
          orderBy: { startsAt: "asc" },
          take,
          select: cardSelect,
        })
      ).map(toCard),
    [] as EventCard[]
  );

export const getPastEvents = (take = 12) =>
  safe(
    async () =>
      (
        await prisma.event.findMany({
          where: { status: "PUBLISHED", startsAt: { lt: new Date(Date.now() - 6 * 3600e3) } },
          orderBy: { startsAt: "desc" },
          take,
          select: cardSelect,
        })
      ).map(toCard),
    [] as EventCard[]
  );

export const getEvent = (slug: string) =>
  safe(
    () =>
      prisma.event.findFirst({
        where: { slug, status: { in: ["PUBLISHED", "CANCELLED"] } },
        include: { ticketTypes: { orderBy: [{ sortOrder: "asc" }, { price: "asc" }] } },
      }),
    null
  );

export type GalleryImage = { id?: string; src: string; width: number; height: number; caption?: string | null };

/** Admin-uploaded images first, then the original photo set. */
export async function getGallery(): Promise<GalleryImage[]> {
  const uploaded = await safe(() => prisma.galleryItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }), []);
  return [
    ...uploaded.map((g) => ({ id: g.id, src: g.url, width: g.width || 1200, height: g.height || 1500, caption: g.caption })),
    ...galleryFallback.map((g) => ({ src: g.src, width: g.width, height: g.height })),
  ];
}

export const getVideos = () => safe(() => prisma.video.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }), []);
