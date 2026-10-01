import type { MetadataRoute } from "next";

/** Lets visitors "install" the site (Add to Home Screen). Their tickets then open offline too. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kuber Maheshwari",
    short_name: "Kuber Ji",
    description: "Bhajan · Sundarkand · Events & tickets",
    start_url: "/my-tickets",
    scope: "/",
    display: "standalone",
    background_color: "#0f0a0b",
    theme_color: "#0f0a0b",
    orientation: "portrait",
    icons: [
      { src: "/images/brand/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/images/brand/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/images/brand/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [{ name: "My Tickets", url: "/my-tickets" }, { name: "Events", url: "/events" }],
  };
}
