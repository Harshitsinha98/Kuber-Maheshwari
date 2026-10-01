"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type Status = "ADMITTED" | "GROUP" | "ALREADY_USED" | "INVALID" | "NOT_PAID" | "WRONG_EVENT";
type Result = {
  ok: boolean;
  status: Status;
  ticket?: { code: string; name: string; type: string; seat: string | null; event: string };
  at?: string;
  error?: string;
  admitted?: number;
  total?: number;
  entered?: number;
  remaining?: number;
};

const labels: Record<Status, string> = {
  ADMITTED: "Entry allowed",
  GROUP: "Group pass",
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
  const [group, setGroup] = useState<{ payload: string; r: Result; n: number } | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [count, setCount] = useState(0);
  const busy = useRef(false);
  const groupOpen = useRef(false);
  const last = useRef<{ v: string; t: number }>({ v: "", t: 0 });
  const eventRef = useRef(eventId);
  eventRef.current = eventId;
  groupOpen.current = Boolean(group);

  const post = useCallback(async (payload: string, admit?: number): Promise<Result> => {
    try {
      const r = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, eventId: eventRef.current || undefined, admit }),
      });
      const data: Result = await r.json();
      if (!r.ok && !data.status) data.status = "INVALID";
      return data;
    } catch {
      return { ok: false, status: "INVALID", error: "Network error. Check internet." };
    }
  }, []);

  const show = useCallback((data: Result) => {
    setResult(data);
    beep(data.ok);
    if (data.status === "ADMITTED") setCount((c) => c + (data.admitted || 1));
  }, []);

  const verify = useCallback(
    async (payload: string) => {
      const now = Date.now();
      // while the "how many?" panel is open, ignore the camera
      if (busy.current || groupOpen.current || (payload === last.current.v && now - last.current.t < 4000)) return;
      busy.current = true;
      last.current = { v: payload, t: now };
      const data = await post(payload);
      busy.current = false;
      if (data.status === "GROUP") {
        beep(true);
        setGroup({ payload, r: data, n: data.remaining || 1 });
      } else show(data);
    },
    [post, show]
  );

  async function admitGroup() {
    if (!group || busy.current) return;
    busy.current = true;
    const data = await post(group.payload, group.n);
    busy.current = false;
    setGroup(null);
    last.current = { v: group.payload, t: Date.now() };
    show(data);
  }

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
    const t = setTimeout(() => setResult(null), result.ok ? 2600 : 3500);
    return () => clearTimeout(t);
  }, [result]);

  const tone = (r: Result) => (r.ok ? "bg-green-600" : r.status === "ALREADY_USED" ? "bg-amber-600" : "bg-red-700");

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

        {/* Group pass: choose how many people are entering now */}
        <AnimatePresence>
          {group && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-sky-700 p-6 text-center text-white"
              data-testid="group-panel"
            >
              <div className="text-sm uppercase tracking-widest opacity-80">Group pass</div>
              <div className="mt-2 text-2xl font-bold">{group.r.ticket?.name}</div>
              <div className="opacity-90">{group.r.ticket?.type}</div>
              <div className="mt-3 rounded-full bg-white/15 px-4 py-1.5 text-sm">
                {group.r.total} tickets · {group.r.entered} already in · <b>{group.r.remaining} left</b>
              </div>
              <div className="mt-6 text-sm opacity-90">How many are entering now?</div>
              <div className="mt-2 flex items-center gap-5">
                <button type="button" aria-label="Fewer" onClick={() => setGroup((g) => g && { ...g, n: Math.max(1, g.n - 1) })} className="h-14 w-14 rounded-full bg-white/20 text-3xl">
                  −
                </button>
                <span className="w-16 text-5xl font-bold tabular-nums" data-testid="group-n">
                  {group.n}
                </span>
                <button
                  type="button"
                  aria-label="More"
                  onClick={() => setGroup((g) => g && { ...g, n: Math.min(g.r.remaining || 1, g.n + 1) })}
                  className="h-14 w-14 rounded-full bg-white/20 text-3xl"
                >
                  +
                </button>
              </div>
              <button type="button" onClick={admitGroup} className="mt-6 h-14 w-full max-w-xs rounded-full bg-white text-lg font-bold text-sky-800">
                Allow {group.n} in
              </button>
              <button type="button" onClick={() => setGroup(null)} className="mt-3 text-sm underline opacity-80">
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white ${tone(result)}`}
              onClick={() => setResult(null)}
            >
              <div className="text-7xl">{result.ok ? "✓" : "✕"}</div>
              <div className="mt-3 text-3xl font-bold uppercase tracking-wide">
                {result.status === "ADMITTED" && (result.admitted || 1) > 1 ? `${result.admitted} people allowed` : labels[result.status]}
              </div>
              {result.ticket && (
                <div className="mt-4 text-lg">
                  <div className="font-semibold">{result.ticket.name}</div>
                  <div className="opacity-90">
                    {result.ticket.type} · {result.ticket.seat}
                  </div>
                  {typeof result.remaining === "number" && (result.total || 0) > 1 && (
                    <div className="mt-2 rounded-full bg-white/15 px-4 py-1 text-sm">
                      {result.entered} of {result.total} in · {result.remaining} left
                    </div>
                  )}
                  {result.status === "WRONG_EVENT" && <div className="mt-1 text-sm opacity-90">Ticket is for: {result.ticket.event}</div>}
                  {result.at && <div className="mt-1 text-sm opacity-90">Last entry at {new Date(result.at).toLocaleTimeString("en-IN")}</div>}
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
          if (manual.trim()) verify(manual.trim().toUpperCase().startsWith("KM2.") ? manual.trim() : manual.trim().toUpperCase());
          setManual("");
        }}
      >
        <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Or type ticket code" className="admin-input font-mono uppercase" />
        <button className="rounded-full bg-ink px-5 text-sm text-ivory">Check</button>
      </form>
      <p className="mt-4 text-xs text-ink/50">
        Each ticket enters only once. A group pass shows how many are left and lets you admit some now and the rest later. Scans are recorded with your email and time.
      </p>
    </div>
  );
}
