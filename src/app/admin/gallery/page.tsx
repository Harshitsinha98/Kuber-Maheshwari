/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/prisma";
import galleryFallback from "@/data/gallery.json";
import { guard } from "../guard";
import { Card, PageTitle } from "../ui";
import { deleteGalleryImage } from "../actions";
import UploadForm from "./UploadForm";

export const dynamic = "force-dynamic";

export default async function AdminGallery() {
  await guard();
  const items = await prisma.galleryItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageTitle title="Gallery" />
      <Card className="mb-6">
        <UploadForm />
      </Card>
      <h2 className="mb-3 font-semibold">Uploaded ({items.length})</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {items.map((g) => (
          <div key={g.id} className="group relative overflow-hidden rounded-xl bg-white">
            <img src={g.url} alt={g.caption || ""} className="aspect-square w-full object-cover" />
            <form action={deleteGalleryImage.bind(null, g.id)} className="absolute right-2 top-2">
              <button className="rounded-full bg-white/90 px-3 py-1 text-xs text-kumkum shadow">Delete</button>
            </form>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-ink/60">
        The original {galleryFallback.length} photos are part of the website itself and always appear after your uploads.
      </p>
    </>
  );
}
