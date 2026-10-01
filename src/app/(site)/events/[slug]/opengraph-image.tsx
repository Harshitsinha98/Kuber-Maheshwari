import { getEvent } from "@/lib/queries";
import { fmtDate, fmtTime, rupees } from "@/lib/format";
import { ogCard, OG_SIZE } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/jpeg";
export const alt = "Event by Kuber Maheshwari";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const e = await getEvent((await params).slug);
  if (!e) return ogCard({ photo: "/images/gallery/kuber-25.webp", kicker: "Live event" });
  const paid = e.ticketTypes.map((t) => t.price).filter((p) => p > 0);
  const badge =
    e.status === "CANCELLED" ? "Event cancelled" : !e.ticketTypes.length ? "Details inside" : paid.length ? `Tickets from ${rupees(Math.min(...paid))}` : "Free entry · Register";
  return ogCard({
    photo: e.posterUrl || "/images/gallery/kuber-25.webp",
    kicker: e.category,
    title: e.title,
    lines: [`${fmtDate(e.startsAt)} · ${fmtTime(e.startsAt)}`, `${e.venueName}, ${e.city}`],
    badge,
  });
}
