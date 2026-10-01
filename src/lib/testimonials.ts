import { prisma, safe } from "./prisma";

/** Devotees' words, managed in Admin → Testimonials. Stored as JSON in the Setting table (no schema change). */
export type Testimonial = { id: string; name: string; place?: string; occasion?: string; text: string; createdAt: string };

const KEY = "testimonials";

export async function getTestimonials(): Promise<Testimonial[]> {
  const row = await safe(() => prisma.setting.findUnique({ where: { key: KEY } }), null);
  try {
    const list = row ? (JSON.parse(row.value) as Testimonial[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveTestimonials(list: Testimonial[]) {
  const value = JSON.stringify(list.slice(0, 60));
  await prisma.setting.upsert({ where: { key: KEY }, update: { value }, create: { key: KEY, value } });
}
