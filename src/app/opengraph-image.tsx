import { ogCard, OG_SIZE } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/jpeg";
export const alt = "Kuber Maheshwari: Bhajan · Sundarkand · Bhakti Fusion";

export default function Image() {
  return ogCard({
    photo: "/images/gallery/kuber-25.webp",
    kicker: "Bhajan Singer · Indore",
    title: "Sangeetmay Shri Sundarkand",
    lines: ["Bhajan Sandhya · Bhakti Fusion · Jagran"],
    badge: "Book for your event",
  });
}
