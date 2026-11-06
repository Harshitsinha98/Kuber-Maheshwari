"use client";

import { AnimatePresence, animate, motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { monthCells } from "@/lib/calendar-grid";
import { fmtDayKey, inr } from "@/lib/format";
import { site, waLink } from "@/lib/site";
import {
  checkAnswers,
  questionsFor,
  quote,
  type Answers,
  type BookingRules,
  type PublicLocation,
  type PublicQuestion,
  type PublicService,
} from "@/lib/show-pricing";
import { WhatsappIcon } from "@/components/site/Icons";
import AvailabilityCalendar, { type DayState } from "./AvailabilityCalendar";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open(): void; on(ev: string, cb: (r: unknown) => void): void };
  }
}

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const ease = [0.16, 1, 0.3, 1] as const;
const stepV: Variants = {
  enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0, filter: "blur(6px)" }),
  center: { x: 0, opacity: 1, filter: "blur(0px)", transition: { duration: 0.55, ease } },
  exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0, filter: "blur(6px)", transition: { duration: 0.3, ease } }),
};

type StepKey = "date" | "service" | "location" | "details" | "contact" | "review";
const STEP_LABEL: Record<StepKey, [string, string]> = {
  date: ["तारीख", "Date"],
  service: ["कार्यक्रम", "Programme"],
  location: ["स्थान", "Venue"],
  details: ["विवरण", "Details"],
  contact: ["संपर्क", "Contact"],
  review: ["पुष्टि", "Confirm"],
};

/** Smoothly counts to the new amount. */
function Amount({ paise, className = "" }: { paise: number; className?: string }) {
  const [v, setV] = useState(paise);
  const prev = useRef(paise);
  useEffect(() => {
    const c = animate(prev.current, paise, { duration: 0.6, ease, onUpdate: (x) => setV(Math.round(x)) });
    prev.current = paise;
    return () => c.stop();
  }, [paise]);
  return <span className={`[font-variant-numeric:lining-nums_tabular-nums] ${className}`}>{inr(v)}</span>;
}

const phoneOk = (p: string) => /^[6-9]\d{9}$/.test(p.replace(/\D/g, "").slice(-10));

export default function BookingWizard({
  services,
  locations,
  questions,
  rules,
  bookable: win,
  paymentsEnabled,
  testMode,
  defaultService,
}: {
  services: PublicService[];
  locations: PublicLocation[];
  questions: PublicQuestion[];
  rules: BookingRules;
  bookable: { today: string; first: string; last: string };
  paymentsEnabled: boolean;
  testMode: boolean;
  defaultService?: string;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  const [month, setMonth] = useState(win.first.slice(0, 7));
  const [monthDir, setMonthDir] = useState(1);
  const [avail, setAvail] = useState<Record<string, Record<string, DayState>>>({});
  const [loadingMonth, setLoadingMonth] = useState<string | null>(null);

  const [date, setDate] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(() => {
    if (!defaultService) return null;
    const k = defaultService.toLowerCase().split(/[\s-]/)[0];
    return services.find((s) => s.name.toLowerCase().includes(k))?.id ?? null;
  });
  const [locationId, setLocationId] = useState<string | null>(locations.length === 1 ? locations[0].id : null);
  const [venue, setVenue] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [contact, setContact] = useState({ name: "", phone: "", email: "", message: "", website: "" });

  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef<{ id: string; orderId: string; amount: number; key: string; fp: string } | null>(null);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const location = locations.find((l) => l.id === locationId) ?? null;
  const qs = useMemo(() => questionsFor(questions, serviceId), [questions, serviceId]);
  const q = quote(service, location, qs, answers, rules.advancePercent);
  const online = paymentsEnabled && q.advance > 0;

  const steps: StepKey[] = useMemo(() => ["date", "service", "location", ...(qs.length ? (["details"] as const) : []), "contact", "review"], [qs.length]);
  const step = steps[Math.min(stepIdx, steps.length - 1)];

  // ---------- availability ----------
  const loadMonth = useCallback(
    async (m: string, force = false) => {
      if (!force && avail[m]) return;
      const cells = monthCells(m);
      setLoadingMonth(m);
      try {
        const r = await fetch(`/api/availability?from=${cells[0].key}&to=${cells[41].key}`, { cache: "no-store" });
        const j = await r.json();
        if (r.ok) setAvail((a) => ({ ...a, [m]: j.days }));
      } finally {
        setLoadingMonth((x) => (x === m ? null : x));
      }
    },
    [avail],
  );
  useEffect(() => {
    loadMonth(month);
  }, [month, loadMonth]);

  const days = useMemo(() => {
    const own = avail[month];
    if (!own) return undefined;
    const out: Record<string, DayState> = {};
    for (const k of Object.keys(avail)) Object.assign(out, avail[k]);
    return out;
  }, [avail, month]);

  // ---------- navigation ----------
  const go = (to: number) => {
    setErr(null);
    setDir(to > stepIdx ? 1 : -1);
    setStepIdx(Math.max(0, Math.min(steps.length - 1, to)));
    const el = rootRef.current;
    if (el && el.getBoundingClientRect().top < 0) {
      const lenis = (window as unknown as { lenis?: { scrollTo: (t: HTMLElement, o?: object) => void } }).lenis;
      if (lenis) lenis.scrollTo(el, { offset: -100 });
      else el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const autoNext = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextSoon = (from: number) => {
    if (autoNext.current) clearTimeout(autoNext.current);
    autoNext.current = setTimeout(() => go(from + 1), 380);
  };
  useEffect(() => () => void (autoNext.current && clearTimeout(autoNext.current)), []);

  const problem = (s: StepKey): string | null => {
    if (s === "date") return date ? null : "कृपया एक उपलब्ध तारीख चुनें।";
    if (s === "service") return service ? null : "कृपया कार्यक्रम चुनें।";
    if (s === "location") return !location ? "कृपया स्थान चुनें।" : venue.trim().length < 5 ? "कृपया आयोजन स्थल का पूरा पता लिखें।" : null;
    if (s === "details") return checkAnswers(qs, answers);
    if (s === "contact") return contact.name.trim().length < 2 ? "कृपया अपना नाम लिखें।" : !phoneOk(contact.phone) ? "कृपया सही 10 अंकों का मोबाइल नंबर लिखें।" : contact.email && !/^\S+@\S+\.\S+$/.test(contact.email) ? "कृपया सही ईमेल लिखें।" : null;
    return null;
  };
  const next = () => {
    const p = problem(step);
    if (p) return setErr(p);
    go(stepIdx + 1);
  };
  const maxReachable = (() => {
    let i = 0;
    while (i < steps.length - 1 && !problem(steps[i])) i++;
    return i;
  })();

  // ---------- submit + pay ----------
  const body = {
    date,
    serviceId,
    locationId,
    venue: venue.trim(),
    answers: Object.fromEntries(qs.map((x) => [x.id, answers[x.id] ?? ""]).filter(([, v]) => v !== "")),
    name: contact.name.trim(),
    phone: contact.phone,
    email: contact.email.trim(),
    message: contact.message.trim(),
    website: contact.website,
  };
  const fp = JSON.stringify(body);

  const openCheckout = async (o: { id: string; orderId: string; amount: number; key: string }) => {
    if (!(await loadRazorpay()) || !window.Razorpay) throw new Error("Payment window could not load. Please check your internet and try again.");
    const rzp = new window.Razorpay({
      key: o.key,
      order_id: o.orderId,
      amount: o.amount,
      currency: "INR",
      name: site.name,
      description: `Advance · ${service?.name} · ${date}`,
      image: "/images/brand/km-logo.png",
      prefill: { name: body.name, email: body.email || undefined, contact: body.phone },
      notes: { date },
      theme: { color: "#E8820C" },
      handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        // Even if this call fails, the Razorpay webhook confirms the booking; the booking page shows the live status.
        await fetch("/api/show-bookings/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) }).catch(() => {});
        pending.current = null;
        router.push(`/booking/${o.id}?new=1`);
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on("payment.failed", () => {
      setErr("भुगतान नहीं हो पाया। कृपया फिर से कोशिश करें। Payment failed, please try again.");
      setBusy(false);
    });
    rzp.open();
  };

  async function submit() {
    for (const s of steps.slice(0, -1)) {
      const p = problem(s);
      if (p) {
        go(steps.indexOf(s));
        return setErr(p);
      }
    }
    setErr(null);
    setBusy(true);
    try {
      // Same choices as the attempt the customer just closed: reopen that payment instead of a new hold.
      if (pending.current?.fp === fp) return await openCheckout(pending.current);
      if (pending.current) {
        await fetch(`/api/show-bookings/${pending.current.id}/release`, { method: "POST" }).catch(() => {});
        pending.current = null;
      }
      const res = await fetch("/api/show-bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: fp });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && date) {
        // Someone else got this date a moment ago: refresh the calendar and send the customer back to it.
        await loadMonth(date.slice(0, 7), true);
        setDate(null);
        go(0);
        setErr(data.error || "यह तारीख अभी-अभी बुक हो गई। कृपया दूसरी तारीख चुनें।");
        setBusy(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again or call us.");
      if (!data.orderId) return router.push(`/booking/${data.bookingId}?new=1`);
      pending.current = { id: data.bookingId, orderId: data.orderId, amount: data.amount, key: data.key, fp };
      await openCheckout(pending.current);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  // ---------- UI ----------
  const card = (on: boolean) =>
    `relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
      on ? "border-saffron bg-saffron/10 shadow-[0_18px_50px_-20px_rgba(232,130,12,0.8)]" : "border-ivory/10 bg-night/40 hover:border-gold/50 hover:bg-ivory/[0.03]"
    }`;
  const Check = ({ on }: { on: boolean }) => (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-all ${on ? "scale-100 border-saffron bg-saffron text-night" : "border-ivory/25 text-transparent"}`}>✓</span>
  );

  return (
    <div ref={rootRef} className="grid gap-8 lg:grid-cols-[1.45fr_1fr]">
      <div className="min-w-0">
        {/* Progress */}
        <ol className="no-scrollbar mb-8 flex gap-2 overflow-x-auto pb-1" aria-label="Booking steps">
          {steps.map((s, i) => {
            const done = i < stepIdx;
            const on = i === stepIdx;
            const can = i <= maxReachable;
            return (
              <li key={s} className="flex-1">
                <button
                  type="button"
                  disabled={!can || busy}
                  onClick={() => go(i)}
                  className={`group w-full min-w-[74px] text-left ${can ? "" : "cursor-not-allowed"}`}
                  aria-current={on ? "step" : undefined}
                >
                  <span className="block h-1 overflow-hidden rounded-full bg-ivory/10">
                    <motion.span className="block h-full rounded-full bg-gradient-to-r from-saffron to-gold" initial={false} animate={{ width: done ? "100%" : on ? "50%" : "0%" }} transition={{ duration: 0.6, ease }} />
                  </span>
                  <span className={`mt-2 block font-hindi text-sm ${on ? "text-ivory" : done ? "text-gold" : "text-ivory/40"}`}>
                    {i + 1}. {STEP_LABEL[s][0]}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="relative min-h-[420px]">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div key={step} custom={dir} variants={stepV} initial="enter" animate="center" exit="exit">
              {step === "date" && (
                <>
                  <h3 className="font-hindi text-3xl leading-[1.4] text-ivory">किस दिन आयोजन है?</h3>
                  <p className="mb-6 text-sm text-muted">Pick a free date. Booked dates can&apos;t be selected.</p>
                  <AvailabilityCalendar
                    month={month}
                    dir={monthDir}
                    onMonth={(m, d) => {
                      setMonthDir(d);
                      setMonth(m);
                    }}
                    days={days}
                    loading={loadingMonth === month}
                    first={win.first}
                    last={win.last}
                    today={win.today}
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      setErr(null);
                      nextSoon(0);
                    }}
                  />
                  {rules.minNoticeDays > 0 && (
                    <p className="mt-4 text-xs text-muted">
                      Online booking opens {rules.minNoticeDays} day{rules.minNoticeDays > 1 ? "s" : ""} ahead. For an earlier date please{" "}
                      <a href={`tel:${site.phones[0].tel}`} className="text-gold underline-offset-4 hover:underline">
                        call us
                      </a>
                      .
                    </p>
                  )}
                </>
              )}

              {step === "service" && (
                <>
                  <h3 className="font-hindi text-3xl leading-[1.4] text-ivory">कौन सा कार्यक्रम?</h3>
                  <p className="mb-6 text-sm text-muted">Choose the programme for {date && fmtDayKey(date, "en")}.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {services.map((s, i) => (
                      <motion.button
                        key={s.id}
                        type="button"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.45, ease } }}
                        onClick={() => {
                          setServiceId(s.id);
                          setErr(null);
                          nextSoon(1);
                        }}
                        aria-pressed={serviceId === s.id}
                        className={card(serviceId === s.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="font-hindi text-xl leading-[1.5] text-ivory">{s.nameHi || s.name}</p>
                            {s.nameHi && <p className="font-display text-base italic text-gold">{s.name}</p>}
                          </div>
                          <Check on={serviceId === s.id} />
                        </div>
                        {s.description && <p className="mt-2 line-clamp-2 text-sm text-ivory/55">{s.description}</p>}
                        {s.basePrice > 0 && <p className="mt-3 text-sm text-ivory/70">{inr(s.basePrice)} से</p>}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}

              {step === "location" && (
                <>
                  <h3 className="font-hindi text-3xl leading-[1.4] text-ivory">आयोजन कहाँ है?</h3>
                  <p className="mb-6 text-sm text-muted">Choose the city. Travelling expense, if any, is added automatically.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {locations.map((l, i) => (
                      <motion.button
                        key={l.id}
                        type="button"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.45, ease } }}
                        onClick={() => {
                          setLocationId(l.id);
                          setErr(null);
                        }}
                        aria-pressed={locationId === l.id}
                        className={card(locationId === l.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex-1 text-lg text-ivory">{l.name}</span>
                          <Check on={locationId === l.id} />
                        </div>
                        <p className={`mt-1 text-sm ${l.travelCost ? "text-gold" : "text-emerald-300/80"}`}>{l.travelCost ? `+ ${inr(l.travelCost)} यात्रा खर्च` : "कोई यात्रा खर्च नहीं"}</p>
                        {l.note && <p className="mt-1 text-xs text-ivory/50">{l.note}</p>}
                      </motion.button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Your city isn&apos;t listed?{" "}
                    <a href={waLink(`नमस्ते, मुझे ${date ? fmtDayKey(date) : ""} को कार्यक्रम के लिए जानकारी चाहिए। मेरा शहर सूची में नहीं है।`)} target="_blank" rel="noopener" className="text-gold underline-offset-4 hover:underline">
                      WhatsApp us
                    </a>
                    .
                  </p>
                  <AnimatePresence>
                    {location && (
                      <motion.label initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 block overflow-hidden">
                        <span className="font-hindi text-lg text-ivory">आयोजन स्थल का पता *</span>
                        <textarea
                          className="field"
                          rows={2}
                          value={venue}
                          onChange={(e) => setVenue(e.target.value)}
                          placeholder="Venue name, area, full address"
                          autoComplete="street-address"
                          maxLength={400}
                        />
                      </motion.label>
                    )}
                  </AnimatePresence>
                </>
              )}

              {step === "details" && (
                <>
                  <h3 className="font-hindi text-3xl leading-[1.4] text-ivory">आयोजन के बारे में</h3>
                  <p className="mb-6 text-sm text-muted">A few details so we can prepare. The price updates as you answer.</p>
                  <div className="space-y-7">
                    {qs.map((x) => (
                      <fieldset key={x.id}>
                        <legend className="font-hindi text-lg text-ivory">
                          {x.labelHi || x.label}
                          {x.required && <span className="text-saffron"> *</span>}
                        </legend>
                        {x.labelHi && <p className="text-xs text-muted">{x.label}</p>}
                        {x.help && <p className="mt-1 text-xs text-ivory/50">{x.help}</p>}
                        {x.kind === "CHOICE" && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {x.options.map((o) => {
                              const on = answers[x.id] === o.id;
                              return (
                                <motion.button
                                  key={o.id}
                                  type="button"
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setAnswers((a) => ({ ...a, [x.id]: o.id }))}
                                  aria-pressed={on}
                                  className={`rounded-full border px-4 py-2.5 text-sm transition-all ${on ? "border-saffron bg-saffron text-night" : "border-ivory/15 text-ivory/80 hover:border-ivory/40"}`}
                                >
                                  {o.label}
                                  {o.price > 0 && <span className={on ? "text-night/70" : "text-gold"}> · +{inr(o.price)}</span>}
                                </motion.button>
                              );
                            })}
                          </div>
                        )}
                        {x.kind === "NUMBER" && (
                          <div className="mt-2 max-w-xs">
                            <input
                              className="field"
                              type="number"
                              inputMode="numeric"
                              min={x.minValue ?? 0}
                              max={x.maxValue ?? undefined}
                              value={answers[x.id] ?? ""}
                              onChange={(e) => setAnswers((a) => ({ ...a, [x.id]: e.target.value }))}
                              placeholder={x.minValue != null ? `Minimum ${x.minValue}` : "Enter a number"}
                            />
                            {x.unitPrice > 0 && (
                              <p className="mt-1 text-xs text-ivory/50">
                                {inr(x.unitPrice)} each{x.freeUnits ? ` above ${x.freeUnits}` : ""}
                              </p>
                            )}
                          </div>
                        )}
                        {x.kind === "TEXT" && (
                          <input className="field mt-1" maxLength={300} value={answers[x.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [x.id]: e.target.value }))} />
                        )}
                      </fieldset>
                    ))}
                  </div>
                </>
              )}

              {step === "contact" && (
                <>
                  <h3 className="font-hindi text-3xl leading-[1.4] text-ivory">आपका संपर्क</h3>
                  <p className="mb-6 text-sm text-muted">We&apos;ll send the confirmation here and call you to plan the programme.</p>
                  <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
                    <input className="field" placeholder="आपका नाम / Your name *" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} autoComplete="name" maxLength={80} />
                    <input className="field" placeholder="मोबाइल नंबर / Mobile *" inputMode="tel" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} autoComplete="tel" maxLength={16} />
                    <input className="field md:col-span-2" type="email" placeholder="ईमेल (वैकल्पिक) / Email for the confirmation" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} autoComplete="email" />
                    <textarea className="field md:col-span-2" rows={2} placeholder="कुछ और बताना चाहें? (वैकल्पिक)" value={contact.message} onChange={(e) => setContact((c) => ({ ...c, message: e.target.value }))} maxLength={1000} />
                    <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden value={contact.website} onChange={(e) => setContact((c) => ({ ...c, website: e.target.value }))} />
                  </div>
                </>
              )}

              {step === "review" && (
                <>
                  <h3 className="font-hindi text-3xl leading-[1.4] text-ivory">{online ? "अग्रिम भुगतान करें, तारीख पक्की करें" : "बुकिंग अनुरोध भेजें"}</h3>
                  <p className="mb-6 text-sm text-muted">Check the details below.</p>
                  <dl className="divide-y divide-ivory/10 rounded-2xl border border-ivory/10 bg-night/40">
                    {[
                      ["तारीख", date ? fmtDayKey(date) : "", 0],
                      ["कार्यक्रम", service ? service.nameHi || service.name : "", 1],
                      ["स्थान", `${location?.name ?? ""}\n${venue}`, 2],
                      ...q.answers.map((a) => [a.question, a.answer, 3] as const),
                      ["संपर्क", `${contact.name} · ${contact.phone}${contact.email ? ` · ${contact.email}` : ""}`, steps.indexOf("contact")],
                    ].map(([k, v, s]) => (
                      <div key={String(k)} className="flex items-start gap-4 px-5 py-3">
                        <dt className="w-28 shrink-0 font-hindi text-sm text-muted">{k}</dt>
                        <dd className="flex-1 whitespace-pre-line text-ivory">{v}</dd>
                        <button type="button" onClick={() => go(Math.min(Number(s), steps.length - 2))} className="text-xs text-gold hover:underline">
                          बदलें
                        </button>
                      </div>
                    ))}
                  </dl>
                  {testMode && online && (
                    <p className="mt-4 rounded-xl border border-marigold/40 bg-marigold/10 px-3 py-2 text-xs text-marigold">
                      Test mode: no real money is charged. Use UPI <b>success@razorpay</b> or card 4111 1111 1111 1111.
                    </p>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {err && (
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-4 rounded-xl border border-marigold/30 bg-marigold/10 px-4 py-3 font-hindi text-marigold">
              {err}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button type="button" onClick={() => go(stepIdx - 1)} disabled={stepIdx === 0 || busy} className="inline-flex h-12 items-center gap-2 rounded-full border border-ivory/15 px-6 font-hindi text-ivory/80 transition-colors hover:border-ivory/40 disabled:invisible">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg> पीछे
          </button>
          {step === "review" ? (
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="shine inline-flex h-14 items-center gap-2 rounded-full bg-saffron px-8 font-hindi text-lg font-semibold text-night shadow-[0_14px_50px_-10px_rgba(232,130,12,0.9)] transition-colors hover:bg-marigold disabled:opacity-60"
            >
              {busy ? "कृपया प्रतीक्षा करें…" : online ? <>₹ अग्रिम {inr(q.advance)} भुगतान करें</> : "अनुरोध भेजें"}
            </button>
          ) : (
            <button type="button" onClick={next} className="inline-flex h-12 items-center gap-2 rounded-full bg-saffron px-8 font-hindi text-lg font-semibold text-night transition-colors hover:bg-marigold">
              आगे <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 18l6-6-6-6" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Live summary */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[26px] bg-gradient-to-br from-gold/50 via-saffron/20 to-maroon/50 p-px">
          <div className="rounded-[25px] bg-night p-6">
            <p className="font-hindi text-base text-gold">आपकी बुकिंग</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between gap-3">
                <span className="text-muted">तारीख</span>
                <span className="text-right text-ivory">{date ? fmtDayKey(date) : "—"}</span>
              </li>
              <AnimatePresence initial={false}>
                {q.lines.map((l) => (
                  <motion.li key={l.label} layout initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="flex justify-between gap-3">
                    <span className="text-ivory/75">{l.label}</span>
                    <span className="shrink-0 tabular-nums text-ivory">{inr(l.amount)}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="hairline my-5" />
            <div className="flex items-baseline justify-between">
              <span className="font-hindi text-muted">कुल राशि</span>
              <Amount paise={q.total} className="font-display text-4xl text-ivory" />
            </div>
            {q.total > 0 && rules.advancePercent > 0 && (
              <div className="mt-4 rounded-2xl bg-saffron/10 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-hindi text-sm text-saffron">{online ? `अभी अग्रिम (${rules.advancePercent}%)` : `अग्रिम (${rules.advancePercent}%)`}</span>
                  <Amount paise={q.advance} className="font-display text-2xl text-saffron" />
                </div>
                <div className="mt-1 flex items-baseline justify-between text-sm text-ivory/60">
                  <span className="font-hindi">शेष राशि बाद में</span>
                  <Amount paise={q.balance} />
                </div>
              </div>
            )}
            <p className="mt-4 text-xs leading-relaxed text-muted">
              {online
                ? "Secure payment via UPI / cards / netbanking (Razorpay). The date is locked for you the moment the advance is paid."
                : "No payment needed now. Our team will call you to confirm the date."}
            </p>
            <a href={waLink()} target="_blank" rel="noopener" className="mt-4 inline-flex items-center gap-2 text-sm text-ivory/70 hover:text-gold">
              <WhatsappIcon className="h-4 w-4" /> सवाल है? WhatsApp करें
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
