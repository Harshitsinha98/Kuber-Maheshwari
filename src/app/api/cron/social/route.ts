import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { refreshInstagramToken } from "@/lib/social";

/** Weekly (vercel.json): keeps the Instagram token alive forever and refreshes the feeds. */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ig = await refreshInstagramToken();
  revalidateTag("instagram");
  revalidateTag("facebook");
  return NextResponse.json({ instagram: ig });
}
