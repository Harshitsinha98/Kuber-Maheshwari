import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/bookings", "/my-tickets", "/t/"] }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
