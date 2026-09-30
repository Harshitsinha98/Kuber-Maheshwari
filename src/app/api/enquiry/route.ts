import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEnquiryEmails } from "@/lib/email";

const Body = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .transform((s) => s.replace(/\D/g, "").slice(-10))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number")),
  email: z.union([z.string().trim().email("Invalid email"), z.literal("")]).optional(),
  eventType: z.string().trim().min(2).max(60),
  eventDate: z.string().max(20).optional(),
  city: z.string().trim().max(60).optional(),
  message: z.string().trim().max(2000).optional(),
  website: z.string().optional(), // honeypot
});

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message || "Invalid" }, { status: 400 });
  if (p.data.website) return NextResponse.json({ ok: true }); // bot

  const { website: _hp, ...data } = p.data;
  void _hp;
  const e = await prisma.enquiry.create({ data: { ...data, email: data.email || null } });
  await sendEnquiryEmails(e);
  return NextResponse.json({ ok: true });
}
