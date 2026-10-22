import gallery from "@/data/gallery.json";

const blurs = new Map(gallery.map((g) => [g.src, g.blur]));

/** next/image props for a built-in gallery photo: src + blurred preview while it loads. */
export function photo(name: string) {
  const src = `/images/gallery/${name}.webp`;
  const blurDataURL = blurs.get(src);
  return blurDataURL ? { src, placeholder: "blur" as const, blurDataURL } : { src };
}

/** Blurred preview for any src (undefined for uploads / remote images). */
export const blurFor = (src: string) => blurs.get(src);
