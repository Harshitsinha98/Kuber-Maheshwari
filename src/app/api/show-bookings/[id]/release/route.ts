import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { releaseHold } from "@/lib/show-booking";

/** The customer changed their choices after closing the payment window: free the held date (only if nothing was paid). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await releaseHold(id, session.user.id).catch((e) => console.error("[show-booking release]", (e as Error).message));
  return NextResponse.json({ ok: true });
}
