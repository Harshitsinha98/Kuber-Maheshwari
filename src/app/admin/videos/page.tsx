/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/prisma";
import { guard } from "../guard";
import { Card, PageTitle } from "../ui";
import { deleteVideo } from "../actions";
import VideoForm from "./VideoForm";

export const dynamic = "force-dynamic";

export default async function AdminVideos() {
  await guard();
  const list = await prisma.video.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageTitle title="Videos" />
      <Card className="mb-6">
        <VideoForm />
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => (
          <Card key={v.id} className="p-3">
            <img src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" className="aspect-video w-full rounded-lg object-cover" />
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-medium">{v.title}</span>
              <form action={deleteVideo.bind(null, v.id)}>
                <button className="text-kumkum">Delete</button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
