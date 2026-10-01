"use client";

import { AnimatePresence, motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { rupees } from "@/lib/format";
import { waLink } from "@/lib/site";
import { WhatsappIcon } from "@/components/site/Icons";

type TT = { id: string; name: string; description: string | null; price: number; maxPerOrder: number; remaining: number };

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open(): void; on(ev: string, cb: (r: unknown) => void): void };
  }
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function TicketPicker({
  event,
  types,
  disabled,
  disabledReason,
  paymentsEnabled,
  testMode = false,
}: {
  event: { id: string; slug: string; title: string };
  types: TT[];
  disabled?: boolean;
  disabledReason?: string;
  paymentsEnabled: boolean;
  testMode?: boolean;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sel, setSel] = useState<string | null>(types.find((t) => t.remaining > 0)?.id ?? null);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const t = types.find((x) => x.id === sel);
  const max = t ? Math.min(t.maxPerOrder, t.remaining) : 1;
  const total = t ? t.price * qty : 0;
  const paidButNoGateway = Boolean(t && t.price > 0 && !paymentsEnabled);

  async function book() {
    if (!t) return;
    setErr(null);
    if (!session) return signIn("google", { callbackUrl: `/events/${event.slug}` });
    if (name.trim().length < 2) return setErr("Please enter the attendee name.");
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10))) return setErr("Please enter a valid 10-digit mobile number.");
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, ticketTypeId: t.id, quantity: qty, name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create booking");
      if (data.free) return router.push(`/bookings/${data.bookingId}?new=1`);

      if (!(await loadRazorpay()) || !window.Razorpay) throw new Error("Payment window failed to load. Check your connection.");
      const rzp = new window.Razorpay({
        key: data.key,
        order_id: data.orderId,
        amount: data.amount,
        currency: "INR",
        name: "Kuber Maheshwari",
        description: `${qty} × ${t.name}: ${event.title}`,
        image: "/images/brand/km-logo.png",
        prefill: { name, email: session.user.email, contact: phone },
        theme: { color: "#E8820C" },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const v = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(r),
          });
          const vd = await v.json();
          if (!v.ok) {
            setErr(vd.error || "Payment verification failed. If money was deducted, your ticket will be issued automatically.");
            setBusy(false);
            return;
          }
          router.push(`/bookings/${vd.bookingId}?new=1`);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", () => {
        setErr("Payment failed. Please try again.");
        setBusy(false);
      });
      rzp.open();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="border border-ivory/10 bg-night-2/80 p-7 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.35em] text-gold">Tickets</p>

      {types.length === 0 ? (
        <p className="mt-6 text-ivory/70">Ticket details will be announced soon.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {types.map((x) => {
            const soldOut = x.remaining <= 0;
            const active = sel === x.id;
            return (
              <li key={x.id}>
                <button
                  type="button"
                  disabled={soldOut || disabled}
                  onClick={() => {
                    setSel(x.id);
                    setQty(1);
                  }}
                  className={`w-full border p-5 text-left transition-all duration-300 ${
                    active ? "border-saffron bg-saffron/10" : "border-ivory/10 hover:border-ivory/30"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-display text-2xl">{x.name}</span>
                    <span className="font-display text-2xl text-gold">{rupees(x.price)}</span>
                  </div>
                  {x.description && <p className="mt-1 text-sm text-muted">{x.description}</p>}
                  <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted">
                    {soldOut ? "Sold out" : x.remaining <= 20 ? `Only ${x.remaining} left` : "Available"}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <AnimatePresence>
        {t && !disabled && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-ivory/70">Quantity</span>
              <div className="flex items-center gap-4">
                <button type="button" aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-10 w-10 rounded-full border border-ivory/20 text-lg hover:border-gold">
                  −
                </button>
                <motion.span key={qty} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-6 text-center font-display text-2xl">
                  {qty}
                </motion.span>
                <button type="button" aria-label="Increase" onClick={() => setQty((q) => Math.min(max, q + 1))} className="h-10 w-10 rounded-full border border-ivory/20 text-lg hover:border-gold">
                  +
                </button>
              </div>
            </div>

            {session && (
              <div className="mt-6 space-y-2">
                <input className="field" placeholder="Attendee name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                <input className="field" placeholder="Mobile number" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                <p className="pt-2 text-xs text-muted">Tickets will be emailed to {session.user.email}</p>
              </div>
            )}

            <div className="mt-8 flex items-baseline justify-between border-t border-ivory/10 pt-6">
              <span className="text-sm text-muted">Total</span>
              <span className="font-display text-4xl text-ivory">{rupees(total)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {err && <p className="mt-4 text-sm text-marigold">{err}</p>}

      {paidButNoGateway && !disabled && t ? (
        <>
          <a
            href={waLink(`नमस्ते, मुझे "${event.title}" के लिए ${qty} × ${t.name} टिकट (${rupees(total)}) बुक करने हैं।`)}
            target="_blank"
            rel="noopener"
            className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#1f9d55] text-sm font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#18864a]"
          >
            <WhatsappIcon className="h-5 w-5" /> Book {qty} on WhatsApp
          </a>
          <p className="mt-4 text-center text-[11px] text-muted">Online payment is starting soon. For now, book directly with our team on WhatsApp.</p>
        </>
      ) : (
      <>
      <button
        type="button"
        onClick={book}
        disabled={!t || busy || disabled || status === "loading"}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-saffron text-sm font-semibold uppercase tracking-[0.18em] text-night transition-colors hover:bg-marigold disabled:cursor-not-allowed disabled:bg-ivory/15 disabled:text-ivory/40"
      >
        {disabled
          ? disabledReason
          : busy
              ? "Please wait…"
              : !session
                ? "Sign in with Google to book"
                : t?.price === 0
                  ? "Reserve free pass"
                  : `Pay ${rupees(total)}`}
      </button>
      <p className="mt-4 text-center text-[11px] text-muted">
        {t?.price === 0 ? "Free pass · Instant QR e-ticket" : "Secure payment via UPI / Cards / Netbanking · Instant QR e-ticket"}
      </p>
      {testMode && t && t.price > 0 && (
        <p className="mt-3 rounded border border-marigold/40 bg-marigold/10 px-3 py-2 text-center text-[11px] text-marigold">
          Test mode: no real money is charged. Use Razorpay test UPI <b>success@razorpay</b> or card 4111 1111 1111 1111.
        </p>
      )}
      </>
      )}
    </div>
  );
}
