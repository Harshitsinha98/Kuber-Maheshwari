/* eslint-disable @next/next/no-img-element -- satori (OG renderer) needs plain <img> */
import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

/**
 * Link-preview images (WhatsApp / Facebook / X). 1200×630 PNG.
 * WhatsApp often ignores .webp previews, so photos are converted to JPEG first.
 * The Hindi name is a pre-rendered PNG because the OG renderer can't shape Devanagari.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const root = process.cwd();
const read = (...p: string[]) => fs.readFileSync(path.join(root, ...p));
const dataUrl = (buf: Buffer, type: string) => `data:${type};base64,${buf.toString("base64")}`;

async function photo(src: string) {
  const sharp = (await import("sharp")).default;
  let input: Buffer;
  if (/^https?:\/\//.test(src)) {
    const r = await fetch(src);
    if (!r.ok) throw new Error(`poster fetch ${r.status}`);
    input = Buffer.from(await r.arrayBuffer());
  } else input = read("public", src.replace(/^\//, ""));
  const out = await sharp(input).rotate().resize(700, 630, { fit: "cover", position: "attention" }).jpeg({ quality: 82 }).toBuffer();
  return dataUrl(out, "image/jpeg");
}

const fonts = () => [
  { name: "Cormorant", data: read("src/fonts/og/cormorant-garamond-600.ttf"), weight: 600 as const, style: "normal" as const },
  { name: "Manrope", data: read("src/fonts/og/manrope-600.ttf"), weight: 600 as const, style: "normal" as const },
];

const hasDevanagari = (s: string) => /[\u0900-\u097F]/.test(s);

export async function ogCard(opts: { photo: string; kicker: string; title?: string; lines?: string[]; badge?: string }) {
  let img: string;
  try {
    img = await photo(opts.photo);
  } catch {
    img = await photo("/images/gallery/kuber-25.webp");
  }
  const name = dataUrl(read("public/images/brand/og-name-hi.png"), "image/png");
  const logo = dataUrl(read("public/images/brand/km-logo.png"), "image/png");
  // Devanagari titles would render broken; the Hindi name image already carries the brand.
  const title = opts.title && !hasDevanagari(opts.title) ? opts.title : undefined;
  const lines = (opts.lines || []).filter((l) => !hasDevanagari(l));

  const png = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#140d0e", fontFamily: "Manrope" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, display: "flex", background: "linear-gradient(90deg,#e8820c,#f3a53a,#d4a64a,#e8820c)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 560, padding: "56px 40px 48px 64px", background: "linear-gradient(135deg,#4a0f19 0%,#2a0810 55%,#140d0e 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img src={logo} width={64} height={64} style={{ borderRadius: 999 }} alt="" />
            <div style={{ fontSize: 22, letterSpacing: 4, color: "#e8820c", textTransform: "uppercase" }}>{opts.kicker}</div>
          </div>
          <img src={name} width={440} height={146} style={{ marginTop: 18, marginLeft: -8 }} alt="" />
          {title && <div style={{ marginTop: 6, fontFamily: "Cormorant", fontSize: title.length > 26 ? 52 : 64, lineHeight: 1.05, color: "#f6eedf" }}>{title}</div>}
          {lines.map((l) => (
            <div key={l} style={{ marginTop: 12, fontSize: 26, color: "#e9dcc3" }}>
              {l}
            </div>
          ))}
          {opts.badge && (
            <div style={{ display: "flex", marginTop: 28 }}>
              <div style={{ padding: "12px 26px", borderRadius: 999, background: "#e8820c", color: "#140d0e", fontSize: 26 }}>{opts.badge}</div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", position: "relative", width: 640, height: 630 }}>
          <img src={img} width={640} height={630} style={{ objectFit: "cover" }} alt="" />
          <div style={{ position: "absolute", top: 0, left: 0, width: 160, height: 630, display: "flex", background: "linear-gradient(90deg,#140d0e,rgba(20,13,14,0))" }} />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts() }
  );
  // JPEG keeps the preview small (~100–200 KB); WhatsApp skips large images.
  const sharp = (await import("sharp")).default;
  const jpg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
}
