import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { BookingError, createShowBooking } from "@/lib/show-booking";

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: z.string().min(1).max(40),
  locationId: z.string().min(1).max(40),
  venue: z.string().trim().min(5, "Please enter the full venue address").max(400),
  answers: z.record(z.string().max(40), z.union([z.string().max(300), z.number()])).default({}),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z
    .string()
    .transform((s) => s.replace(/\D/g, "").slice(-10))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number")),
  message: z.string().trim().max(1000).optional(),
  website: z.string().optional(), // honeypot
});

/** Starts a show booking: validates, re-prices on the server, holds the date and opens a Razorpay order. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || !session.user.email)
    return NextResponse.json({ error: "बुकिंग के लिए कृपया Google से लॉग-इन करें। Please sign in with Google to book." }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  if (p.data.website) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { website: _hp, answers, ...rest } = p.data;
  void _hp;
  try {
    const { booking, order } = await createShowBooking({
      ...rest,
      userId: session.user.id,
      email: session.user.email,
      answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, String(v)])),
    });
    return NextResponse.json({
      bookingId: booking.id,
      ref: booking.ref,
      status: booking.status,
      ...(order ? { orderId: order.id, amount: order.amount, key: order.key } : {}),
    });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[show-booking]", e);
    return NextResponse.json({ error: "Something went wrong. Please try again or call us." }, { status: 500 });
  }
}
