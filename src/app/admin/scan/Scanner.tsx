"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type Result = {
  ok: boolean;
  status: "ADMITTED" | "ALREADY_USED" | "INVALID" | "NOT_PAID" | "WRONG_EVENT";
  ticket?: { code: string; name: string; type: string; seat: string | null; event: string };
  at?: string;
  error?: string;
};

const labels: Record<Result["status"], string> = {
  ADMITTED: "Entry allowed",
  ALREADY_USED: "Already scanned",
  INVALID: "Invalid ticket",
  NOT_PAID: "Not paid",
  WRONG_EVENT: "Different event",
};

function beep(ok: boolean) {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = ok ? 880 : 220;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    o.start();
    o.stop(ctx.currentTime + (ok ? 0.15 : 0.45));
  } catch {}
  navigator.vibrate?.(ok ? 80 : [200, 80, 200]);
}

export default function Scanner({ events, initialEvent }: { events: { id: string; label: string }[]; initialEvent: string }) {
  const [eventId, setEventId] = useState(initialEvent);
  const [result, setResult] = useState<Result | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [count, setCount] = useState(0);
  const busy = useRef(false);
  const last = useRef<{ v: string; t: number }>({ v: "", t: 0 });
  const eventRef = useRef(eventId);
  eventRef.current = eventId;

  const verify = useCallback(async (payload: string) => {
    const now = Date.now();
    if (busy.current || (payload === last.current.v && now - last.current.t < 4000)) return;
    busy.current = true;
    last.current = { v: payload, t: now };
    try {
      const r = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, eventId: eventRef.current || undefined }),
      });
      const data: Result = await r.json();
      if (!r.ok && !data.status) data.status = "INVALID";
      setResult(data);
      beep(data.ok);
      if (data.ok) setCount((c) => c + 1);
    } catch {
      setResult({ ok: false, status: "INVALID", error: "Network error. Check internet." });
      beep(false);
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    let scanner: { stop(): Promise<void>; clear(): void } | null = null;
    let cancelled = false;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      const s = new Html5Qrcode("qr-reader", { verbose: false });
      scanner = s;
      try {
        await s.start({ facingMode: "environment" }, { fps: 12, qrbox: (w: number, h: number) => ({ width: Math.min(w, h) * 0.7, height: Math.min(w, h) * 0.7 }) }, (text: string) => verify(text), () => {});
      } catch (e) {
        setCamErr("Camera not available. Allow camera permission, or type the ticket code below.");
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
      scanner?.stop().then(() => scanner?.clear()).catch(() => {});
    };
  }, [verify]);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), result.ok ? 2200 : 3500);
    return () => clearTimeout(t);
  }, [result]);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-4xl">Scan tickets</h1>
        <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">Admitted: {count}</span>
      </div>
      <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="admin-input mb-4">
        <option value="">Any event</option>
        {events.map((e) => (
          <option key={e.id} value={e.id}>
            {e.label}
          </option>
        ))}
      </select>

      <div className="relative overflow-hidden rounded-2xl bg-black">
        <div id="qr-reader" className="aspect-square w-full [&_video]:!h-full [&_video]:!w-full [&_video]:object-cover" />
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white ${result.ok ? "bg-green-600" : result.status === "ALREADY_USED" ? "bg-amber-600" : "bg-red-700"}`}
              onClick={() => setResult(null)}
            >
              <div className="text-7xl">{result.ok ? "✓" : "✕"}</div>
              <div className="mt-3 text-3xl font-bold uppercase tracking-wide">{labels[result.status]}</div>
              {result.ticket && (
                <div className="mt-4 text-lg">
                  <div className="font-semibold">{result.ticket.name}</div>
                  <div className="opacity-90">
                    {result.ticket.type} · {result.ticket.seat}
                  </div>
                  {result.status === "WRONG_EVENT" && <div className="mt-1 text-sm opacity-90">Ticket is for: {result.ticket.event}</div>}
                  {result.at && <div className="mt-1 text-sm opacity-90">First scanned at {new Date(result.at).toLocaleTimeString("en-IN")}</div>}
                </div>
              )}
              {result.error && <div className="mt-3">{result.error}</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {camErr && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{camErr}</p>}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (manual.trim()) verify(manual.trim().toUpperCase());
          setManual("");
        }}
      >
        <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Or type ticket code" className="admin-input font-mono uppercase" />
        <button className="rounded-full bg-ink px-5 text-sm text-ivory">Check</button>
      </form>
      <p className="mt-4 text-xs text-ink/50">Each ticket can enter only once. Scans are recorded with your email and time.</p>
    </div>
  );
}
