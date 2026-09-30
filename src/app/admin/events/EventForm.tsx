"use client";

import { useActionState, useState } from "react";
import { compressImage } from "@/lib/compress-image";
import { saveEvent, type FormState } from "../actions";
import { btn, btnGhost } from "../ui";

type TT = { id?: string; name: string; description: string; price: number; capacity: number; maxPerOrder: number };

export type EventDefaults = {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  startsAt: string;
  endsAt: string;
  gatesOpenAt: string;
  venueName: string;
  address: string;
  city: string;
  mapUrl: string;
  posterUrl: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  ticketTypes: TT[];
};

const categories = ["Bhajan Sandhya", "Sundarkand", "Bhajan Clubbing", "Bhakti Fusion", "Mata Jagran", "Shyam Kirtan", "Concert"];

export default function EventForm({ id, d }: { id: string | null; d: EventDefaults }) {
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const poster = fd.get("posterFile");
    if (poster instanceof File && poster.size > 0) fd.set("posterFile", await compressImage(poster));
    return saveEvent(id, prev, fd);
  }, undefined);
  const [types, setTypes] = useState<TT[]>(d.ticketTypes.length ? d.ticketTypes : [{ name: "General", description: "", price: 0, capacity: 200, maxPerOrder: 10 }]);

  const set = (i: number, k: keyof TT, v: string) =>
    setTypes((ts) =>
      ts.map((t, j) => (j === i ? { ...t, [k]: k === "name" || k === "description" ? v : Number(v.replace(/[^\d.]/g, "")) || 0 } : t))
    );

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <L label="Title *">
          <input name="title" required defaultValue={d.title} className="admin-input" placeholder="e.g. Sangeetmay Sundarkand, Indore" />
        </L>
        <L label="Category *">
          <input name="category" required defaultValue={d.category} list="cats" className="admin-input" />
          <datalist id="cats">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </L>
        <L label="Subtitle" wide>
          <input name="subtitle" defaultValue={d.subtitle} className="admin-input" placeholder="One line shown under the title" />
        </L>
        <L label="Description *" wide>
          <textarea name="description" required rows={5} defaultValue={d.description} className="admin-input" />
        </L>
        <L label="Starts at (IST) *">
          <input type="datetime-local" name="startsAt" required defaultValue={d.startsAt} className="admin-input" />
        </L>
        <L label="Ends at (IST)">
          <input type="datetime-local" name="endsAt" defaultValue={d.endsAt} className="admin-input" />
        </L>
        <L label="Gates open (IST)">
          <input type="datetime-local" name="gatesOpenAt" defaultValue={d.gatesOpenAt} className="admin-input" />
        </L>
        <L label="Status">
          <select name="status" defaultValue={d.status} className="admin-input">
            <option value="DRAFT">Draft (hidden)</option>
            <option value="PUBLISHED">Published</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </L>
        <L label="Venue name *">
          <input name="venueName" required defaultValue={d.venueName} className="admin-input" />
        </L>
        <L label="City *">
          <input name="city" required defaultValue={d.city} className="admin-input" />
        </L>
        <L label="Address *" wide>
          <input name="address" required defaultValue={d.address} className="admin-input" />
        </L>
        <L label="Google Maps link (optional)" wide>
          <input name="mapUrl" type="url" defaultValue={d.mapUrl} className="admin-input" placeholder="https://maps.app.goo.gl/…" />
        </L>
        <L label="Poster: upload" >
          <input name="posterFile" type="file" accept="image/*" className="admin-input" />
        </L>
        <L label="…or poster image URL">
          <input name="posterUrl" defaultValue={d.posterUrl} className="admin-input" placeholder="/images/gallery/kuber-01.webp" />
        </L>
      </div>

      <div className="rounded-2xl border border-[#eadfca] bg-[#fcf8f0] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Ticket types</h3>
          <button type="button" className={btnGhost} onClick={() => setTypes((t) => [...t, { name: "", description: "", price: 0, capacity: 100, maxPerOrder: 10 }])}>
            + Add type
          </button>
        </div>
        <div className="space-y-3">
          {types.map((t, i) => (
            <div key={t.id ?? `n${i}`} className="grid gap-2 rounded-xl bg-white p-3 md:grid-cols-[1.2fr_1.5fr_0.8fr_0.8fr_0.7fr_auto]">
              <input className="admin-input" placeholder="Name (VIP, General…)" value={t.name} onChange={(e) => set(i, "name", e.target.value)} required />
              <input className="admin-input" placeholder="Description" value={t.description} onChange={(e) => set(i, "description", e.target.value)} />
              <label className="text-xs text-ink/60">
                Price ₹{" "}
                <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${t.price > 0 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                  {t.price > 0 ? `₹${t.price.toLocaleString("en-IN")}` : "FREE"}
                </span>
                <input className="admin-input" inputMode="numeric" value={t.price === 0 ? "0" : String(t.price)} onChange={(e) => set(i, "price", e.target.value)} onFocus={(e) => e.target.select()} />
              </label>
              <label className="text-xs text-ink/60">
                Capacity
                <input className="admin-input" type="number" min={1} value={t.capacity} onChange={(e) => set(i, "capacity", e.target.value)} />
              </label>
              <label className="text-xs text-ink/60">
                Max/order
                <input className="admin-input" type="number" min={1} max={20} value={t.maxPerOrder} onChange={(e) => set(i, "maxPerOrder", e.target.value)} />
              </label>
              <button type="button" onClick={() => setTypes((ts) => ts.filter((_, j) => j !== i))} className="self-center px-2 text-sm text-kumkum" aria-label="Remove">
                Remove
              </button>
            </div>
          ))}
        </div>
        <input type="hidden" name="ticketTypes" value={JSON.stringify(types)} />
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <button className={btn} disabled={pending}>
        {pending ? "Saving…" : id ? "Save changes" : "Create event"}
      </button>
    </form>
  );
}

function L({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block text-sm ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-1 block text-ink/70">{label}</span>
      {children}
    </label>
  );
}
