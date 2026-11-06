import { NextResponse } from "next/server";
import { releaseHold } from "@/lib/show-booking";

/** The customer changed their choices after closing the payment window: free the held date (only if nothing was paid). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await releaseHold(id).catch((e) => console.error("[show-booking release]", (e as Error).message));
  return NextResponse.json({ ok: true });
}
