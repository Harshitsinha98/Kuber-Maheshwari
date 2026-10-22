// Converts the original photos into web images + src/data/gallery.json.
// Usage: node scripts/optimize-images.mjs
//
// Sources:
//   assets/original-photos/  – first WhatsApp set; numbered kuber-01… by sorted filename.
//   assets/hq-photos/        – high-quality camera originals named kuber-NN.jpg.
//                              Same number = replaces the WhatsApp copy; new number = new photo.
//
// HQ photos are kept up to 2400px (sharp on retina / full-screen hero); WhatsApp
// copies are capped at 2000px. Both are encoded at high quality because next/image
// re-encodes them per device anyway.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const legacyDir = "assets/original-photos";
const hqDir = "assets/hq-photos";
const outDir = path.join("public", "images", "gallery");
// kuber-13 and kuber-22 are logo artwork (used as the site logo), not gallery photos.
const SKIP = new Set(["kuber-13", "kuber-22"]);
// Newest HQ photos are shown first in the gallery.
const FEATURED_FIRST = ["kuber-44", "kuber-47", "kuber-25", "kuber-48", "kuber-46", "kuber-03", "kuber-45", "kuber-15"];
fs.mkdirSync(outDir, { recursive: true });

const isImg = (f) => /\.(jpe?g|png|webp)$/i.test(f);
const sources = new Map();

fs.readdirSync(legacyDir)
  .filter(isImg)
  .sort()
  .forEach((f, i) => sources.set(`kuber-${String(i + 1).padStart(2, "0")}`, { file: path.join(legacyDir, f), max: 2000 }));

if (fs.existsSync(hqDir)) {
  for (const f of fs.readdirSync(hqDir).filter(isImg)) {
    const m = f.match(/^(kuber-\d{2,})\./i);
    if (m) sources.set(m[1].toLowerCase(), { file: path.join(hqDir, f), max: 2400 });
  }
}

const built = [];
for (const [base, { file, max }] of [...sources].sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }))) {
  if (SKIP.has(base)) continue;
  const info = await sharp(file)
    .rotate()
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, smartSubsample: true, effort: 6 })
    .toFile(path.join(outDir, `${base}.webp`));
  // Tiny blurred preview shown while the real photo loads (next/image placeholder="blur").
  const tiny = await sharp(file).rotate().resize(12, 12, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
  built.push({
    base,
    src: `/images/gallery/${base}.webp`,
    width: info.width,
    height: info.height,
    orientation: info.height > info.width ? "portrait" : info.height === info.width ? "square" : "landscape",
    blur: `data:image/webp;base64,${tiny.toString("base64")}`,
  });
}

const rank = (b) => (FEATURED_FIRST.includes(b) ? FEATURED_FIRST.indexOf(b) : FEATURED_FIRST.length);
const manifest = built
  .map((m, i) => ({ ...m, i }))
  .sort((a, b) => rank(a.base) - rank(b.base) || a.i - b.i)
  .map(({ src, width, height, orientation, blur }) => ({ src, width, height, orientation, blur }));

fs.writeFileSync(path.join("src", "data", "gallery.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Optimized ${manifest.length} images`);
