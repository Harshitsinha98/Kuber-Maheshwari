// One-time helper: converts raw WhatsApp uploads into web-optimized images.
// Usage: node scripts/optimize-images.mjs <sourceDir>
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const src = process.argv[2] || "raw-media";
const outDir = path.join("public", "images", "gallery");
fs.mkdirSync(outDir, { recursive: true });

const files = fs
  .readdirSync(src)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .sort();

const manifest = [];
let i = 1;
for (const f of files) {
  const name = `kuber-${String(i).padStart(2, "0")}.webp`;
  const img = sharp(path.join(src, f)).rotate();
  const meta = await img.metadata();
  const info = await img
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(outDir, name));
  manifest.push({
    src: `/images/gallery/${name}`,
    width: info.width,
    height: info.height,
    orientation: (meta.height ?? 0) > (meta.width ?? 0) ? "portrait" : "landscape",
  });
  i++;
}

fs.writeFileSync(
  path.join("src", "data", "gallery.json"),
  JSON.stringify(manifest, null, 2)
);
console.log(`Optimized ${manifest.length} images`);
