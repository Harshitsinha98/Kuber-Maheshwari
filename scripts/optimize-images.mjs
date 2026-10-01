// Converts the original uploads into web images.
// Usage: node scripts/optimize-images.mjs [sourceDir]
// Keeps full original resolution (capped at 2000px) and encodes at high quality,
// because the originals are already compressed (WhatsApp) and can't afford more loss.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const src = process.argv[2] || "assets/original-photos";
const outDir = path.join("public", "images", "gallery");
// kuber-13 and kuber-22 are logo artwork (used as the site logo), not gallery photos.
const SKIP = new Set(["kuber-13", "kuber-22"]);
fs.mkdirSync(outDir, { recursive: true });

const files = fs
  .readdirSync(src)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .sort();

const manifest = [];
let i = 1;
for (const f of files) {
  const base = `kuber-${String(i++).padStart(2, "0")}`;
  if (SKIP.has(base)) continue;
  const info = await sharp(path.join(src, f))
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, smartSubsample: true, effort: 6 })
    .toFile(path.join(outDir, `${base}.webp`));
  manifest.push({
    src: `/images/gallery/${base}.webp`,
    width: info.width,
    height: info.height,
    orientation: info.height > info.width ? "portrait" : "landscape",
  });
}

fs.writeFileSync(path.join("src", "data", "gallery.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Optimized ${manifest.length} images`);
