"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { site, waLink } from "@/lib/site";

const types = ["Sundarkand", "Bhajan Sandhya", "Bhajan Clubbing", "Bhakti Fusion", "Mata Jagran", "Shyam Kirtan", "Wedding / Family function", "Studio recording", "Other"];

export default function EnquiryForm({ defaultType }: { defaultType?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [type, setType] = useState(types.find((t) => defaultType && t.toLowerCase().startsWith(defaultType.toLowerCase().split(" ")[0])) || types[0]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setState("busy");
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fd) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || "Something went wrong. Please call or WhatsApp us.");
      setState("idle");
      return;
    }
    setState("done");
  }

  return (
    <AnimatePresence mode="wait">
      {state === "done" ? (
        <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border border-gold/30 p-10 text-center">
          <p className="font-hindi text-4xl text-gold">धन्यवाद 🙏</p>
          <p className="mt-4 text-lg text-ivory/80">Your enquiry has been received. We&apos;ll call you back shortly.</p>
          <a href={waLink(`नमस्ते, मैंने वेबसाइट पर ${type} के लिए enquiry भेजी है।`)} target="_blank" rel="noopener" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#1f9d55] px-6 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            Also message on WhatsApp
          </a>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-muted">Type of event</p>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-full border px-4 py-2 text-sm transition-all ${type === t ? "border-saffron bg-saffron text-night" : "border-ivory/15 text-ivory/70 hover:border-ivory/40"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input type="hidden" name="eventType" value={type} />
          </div>
          <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
            <input className="field" name="name" placeholder="Your name *" required autoComplete="name" />
            <input className="field" name="phone" placeholder="Mobile number *" required inputMode="tel" autoComplete="tel" />
            <input className="field" name="email" type="email" placeholder="Email (optional)" autoComplete="email" />
            <input className="field" name="city" placeholder="City / Venue" />
            <label className="md:col-span-2">
              <span className="sr-only">Event date</span>
              <input className="field [color-scheme:dark]" name="eventDate" type="date" />
            </label>
            <textarea className="field md:col-span-2" name="message" rows={3} placeholder="Tell us about your event: expected audience, duration, etc." />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          </div>
          {err && <p className="text-sm text-marigold">{err}</p>}
          <div className="flex flex-wrap items-center gap-6">
            <button disabled={state === "busy"} className="inline-flex h-14 items-center rounded-full bg-saffron px-10 text-sm font-semibold uppercase tracking-[0.16em] text-night hover:bg-marigold disabled:opacity-60">
              {state === "busy" ? "Sending…" : "Send enquiry"}
            </button>
            <span className="text-sm text-muted">
              or call <a className="text-ivory hover:text-gold" href={`tel:${site.phones[0].tel}`}>{site.phones[0].display}</a>
            </span>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
