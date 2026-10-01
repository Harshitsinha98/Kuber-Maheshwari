import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default is 1 MB. Photos are compressed in the browser first; 4 MB stays under Vercel's 4.5 MB cap.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // The Apple Wallet route reads the logo from disk to build pass icons.
  outputFileTracingIncludes: {
    "/api/tickets/[id]/apple-wallet": ["./public/images/brand/km-logo.png"],
    // link-preview images read fonts/photos from disk
    "/opengraph-image": ["./src/fonts/og/**", "./public/images/brand/**", "./public/images/gallery/kuber-25.webp"],
    "/events/[slug]/opengraph-image": ["./src/fonts/og/**", "./public/images/brand/**", "./public/images/gallery/**"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
