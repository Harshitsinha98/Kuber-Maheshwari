"use server";

import { put } from "@vercel/blob";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromLocalIST, slugify } from "@/lib/format";
import { refreshInstagramToken, setSetting } from "@/lib/social";

async function admin() {
  const s = await requireRole(["ADMIN"]);
  if (!s) throw new Error("Not authorised");
  return s;
}

const revalidatePublic = () => {
  ["/", "/events", "/gallery", "/videos"].forEach((p) => revalidatePath(p));
};

// ---------- Events ----------

const TicketTypeIn = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
  price: z.coerce.number().min(0), // rupees in the form
  capacity: z.coerce.number().int().min(1),
  maxPerOrder: z.coerce.number().int().min(1).max(20).default(10),
});

const EventIn = z.object({
  title: z.string().trim().min(3),
  subtitle: z.string().trim().optional(),
  description: z.string().trim().min(1),
  category: z.string().trim().min(2),
  startsAt: z.string().min(10),
  endsAt: z.string().optional(),
  gatesOpenAt: z.string().optional(),
  venueName: z.string().trim().min(2),
  address: z.string().trim().min(2),
  city: z.string().trim().min(2),
  mapUrl: z.string().trim().url().optional().or(z.literal("")),
  posterUrl: z.string().trim().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]),
  ticketTypes: z.string().transform((s, ctx) => {
    try {
      return z.array(TicketTypeIn).parse(JSON.parse(s || "[]"));
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid ticket types" });
      return z.NEVER;
    }
  }),
});

export type FormState = { error?: string } | undefined;

export async function saveEvent(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  await admin();
  const raw = Object.fromEntries(fd);
  const p = EventIn.safeParse(raw);
  if (!p.success) return { error: p.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ") };
  const d = p.data;

  let posterUrl = d.posterUrl || null;
  const poster = fd.get("posterFile");
  if (poster instanceof File && poster.size > 0) posterUrl = (await uploadImage(poster, "posters")).url;

  const data = {
    title: d.title,
    subtitle: d.subtitle || null,
    description: d.description,
    category: d.category,
    startsAt: fromLocalIST(d.startsAt),
    endsAt: d.endsAt ? fromLocalIST(d.endsAt) : null,
    gatesOpenAt: d.gatesOpenAt ? fromLocalIST(d.gatesOpenAt) : null,
    venueName: d.venueName,
    address: d.address,
    city: d.city,
    mapUrl: d.mapUrl || null,
    posterUrl,
    status: d.status,
  };

  let eventId: string;
  try {
    eventId = await prisma.$transaction(async (tx) => {
      let ev;
      if (id) ev = await tx.event.update({ where: { id }, data });
      else {
        let slug = slugify(`${d.title}-${d.city}-${d.startsAt.slice(0, 10)}`);
        if (await tx.event.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
        ev = await tx.event.create({ data: { ...data, slug } });
      }

      const existing = await tx.ticketType.findMany({ where: { eventId: ev.id }, include: { _count: { select: { bookings: true } } } });
      const keep = new Set(d.ticketTypes.map((t) => t.id).filter(Boolean));
      for (const old of existing) {
        if (!keep.has(old.id)) {
          if (old._count.bookings > 0) throw new Error(`"${old.name}" already has bookings. Set its capacity instead of deleting it.`);
          await tx.ticketType.delete({ where: { id: old.id } });
        }
      }
      for (const [i, t] of d.ticketTypes.entries()) {
        const row = { name: t.name, description: t.description || null, price: Math.round(t.price * 100), capacity: t.capacity, maxPerOrder: t.maxPerOrder, sortOrder: i };
        if (t.id && existing.some((e) => e.id === t.id)) await tx.ticketType.update({ where: { id: t.id }, data: row });
        else await tx.ticketType.create({ data: { ...row, eventId: ev.id } });
      }
      return ev.id;
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePublic();
  redirect(`/admin/events/${eventId}?saved=1`);
}

export async function deleteEvent(id: string) {
  await admin();
  const paid = await prisma.booking.count({ where: { eventId: id, status: "PAID" } });
  if (paid > 0) throw new Error("Event has paid bookings. Cancel it instead of deleting.");
  await prisma.booking.deleteMany({ where: { eventId: id } });
  await prisma.event.delete({ where: { id } });
  revalidatePublic();
  redirect("/admin/events");
}

export async function manualCheckIn(ticketId: string, undo = false) {
  const s = await admin();
  await prisma.ticket.update({ where: { id: ticketId }, data: undo ? { checkedInAt: null, checkedInBy: null } : { checkedInAt: new Date(), checkedInBy: s.user.email } });
  revalidatePath("/admin/events");
}

export async function resendTickets(bookingId: string) {
  await admin();
  const { sendTicketEmail } = await import("@/lib/email");
  await sendTicketEmail(bookingId);
}

// ---------- Media ----------

async function uploadImage(file: File, folder: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Image uploads need BLOB_READ_WRITE_TOKEN (Vercel Blob). You can paste an image URL instead.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Image too large (max 15 MB)");
  const input = Buffer.from(await file.arrayBuffer());
  const img = sharp(input).rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true });
  const out = await img.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  const blob = await put(`${folder}/${Date.now()}-${slugify(file.name)}.webp`, out.data, { access: "public", contentType: "image/webp" });
  return { url: blob.url, width: out.info.width, height: out.info.height };
}

export async function addGalleryImages(_prev: FormState, fd: FormData): Promise<FormState> {
  await admin();
  try {
    const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    const url = String(fd.get("url") || "").trim();
    const caption = String(fd.get("caption") || "").trim() || null;
    if (!files.length && !url) return { error: "Choose images or paste an image URL" };
    for (const f of files) {
      const up = await uploadImage(f, "gallery");
      await prisma.galleryItem.create({ data: { url: up.url, width: up.width, height: up.height, caption } });
    }
    if (url) await prisma.galleryItem.create({ data: { url, caption } });
    revalidatePublic();
    revalidatePath("/admin/gallery");
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteGalleryImage(id: string) {
  await admin();
  await prisma.galleryItem.delete({ where: { id } });
  revalidatePublic();
  revalidatePath("/admin/gallery");
}

const ytId = (s: string) => s.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)?.[1] || (/^[\w-]{11}$/.test(s) ? s : null);

export async function addVideo(_prev: FormState, fd: FormData): Promise<FormState> {
  await admin();
  const id = ytId(String(fd.get("url") || "").trim());
  const title = String(fd.get("title") || "").trim();
  if (!id) return { error: "Paste a valid YouTube link" };
  if (!title) return { error: "Title is required" };
  await prisma.video.create({ data: { youtubeId: id, title } });
  revalidatePublic();
  revalidatePath("/admin/videos");
  return {};
}

export async function deleteVideo(id: string) {
  await admin();
  await prisma.video.delete({ where: { id } });
  revalidatePublic();
  revalidatePath("/admin/videos");
}

// ---------- Enquiries ----------

export async function toggleEnquiry(id: string, handled: boolean) {
  await admin();
  await prisma.enquiry.update({ where: { id }, data: { handled } });
  revalidatePath("/admin/enquiries");
}

// ---------- Social ----------

export async function saveSocial(_prev: FormState, fd: FormData): Promise<FormState & { ok?: string }> {
  await admin();
  const ig = String(fd.get("instagram_token") || "").trim();
  const fbId = String(fd.get("facebook_page_id") || "").trim();
  const fbToken = String(fd.get("facebook_page_token") || "").trim();
  if (ig) await setSetting("instagram_token", ig);
  if (fbId) await setSetting("facebook_page_id", fbId);
  if (fbToken) await setSetting("facebook_page_token", fbToken);
  revalidateTag("instagram");
  revalidateTag("facebook");
  revalidatePath("/");
  return { ok: "Saved. Feeds refreshed." };
}

export async function refreshSocialNow() {
  await admin();
  const r = await refreshInstagramToken();
  revalidateTag("instagram");
  revalidateTag("facebook");
  revalidatePath("/");
  return r;
}
