import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { checkIn } from "@/lib/tickets";

const Body = z.object({
  payload: z.string().min(4).max(300),
  eventId: z.string().optional(),
  /** group pass: how many of the remaining tickets to let in now */
  admit: z.number().int().min(1).max(100).optional(),
});

export async function POST(req: Request) {
  const s = await requireRole(["ADMIN", "STAFF"]);
  if (!s) return NextResponse.json({ error: "Only admin/staff can scan tickets" }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ ok: false, status: "INVALID" }, { status: 400 });
  const result = await checkIn(p.data.payload, s.user.email || "staff", p.data.eventId || undefined, p.data.admit);
  return NextResponse.json(result);
}
