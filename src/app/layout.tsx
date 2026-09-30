import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Providers from "@/components/Providers";
import { site } from "@/lib/site";
import "./globals.css";

// Self-hosted (SIL Open Font License): no runtime or build-time dependency on Google Fonts.
const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant.woff2", weight: "300 700", style: "normal" },
    { path: "../fonts/cormorant-italic.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }],
});
const tiro = localFont({ src: "../fonts/tiro-devanagari.woff2", weight: "400", variable: "--font-tiro", display: "swap", declarations: [{ prop: "unicode-range", value: "U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF, U+11B00-11B09" }] });
const manrope = localFont({ src: "../fonts/manrope.woff2", weight: "300 700", variable: "--font-manrope", display: "swap", declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }] });
const mukta = localFont({
  src: [
    { path: "../fonts/mukta-400.woff2", weight: "400" },
    { path: "../fonts/mukta-600.woff2", weight: "600" },
  ],
  variable: "--font-mukta",
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF, U+11B00-11B09" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Kuber Maheshwari (कुबेर माहेश्वरी) | Sundarkand & Bhajan Singer, Indore",
    template: "%s | Kuber Maheshwari",
  },
  description:
    "Kuber Maheshwari (कुबेर माहेश्वरी) is a bhajan singer from Indore, known for Sangeetmay Shri Sundarkand with bhavarth, Bhajan Clubbing and Bhakti Fusion. See upcoming events, book tickets, or invite him to your event.",
  keywords: site.keywords,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Kuber Maheshwari",
    images: [{ url: "/images/gallery/kuber-07.webp", width: 900, height: 900 }],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#0f0a0b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi-IN" className={`${cormorant.variable} ${tiro.variable} ${manrope.variable} ${mukta.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
