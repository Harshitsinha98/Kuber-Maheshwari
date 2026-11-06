"use client";

import { useActionState, useRef, useState } from "react";
import { inr } from "@/lib/format";
import type { ChoiceOption, PublicQuestion } from "@/lib/show-pricing";
import { advanceFor } from "@/lib/show-pricing";
import {
  deleteLocation,
  deleteQuestion,
  deleteService,
  saveLocation,
  saveQuestion,
  saveRulesAction,
  saveService,
  type ActionState,
} from "../booking-actions";
import { btn, btnGhost } from "../ui";

type Save = (p: ActionState, fd: FormData) => Promise<ActionState>;

/** useActionState + clears "new item" forms after a successful save. */
function useSave(action: Save, resetOnOk = false) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, run, pending] = useActionState<ActionState, FormData>(async (p, fd) => {
    const r = await action(p, fd);
    if (resetOnOk && r?.ok) ref.current?.reset();
    return r;
  }, undefined);
  return { ref, state, run, pending };
}

const Msg = ({ s }: { s: ActionState }) =>
  s?.error ? <p className="text-sm text-red-700">{s.error}</p> : s?.ok ? <p className="text-sm text-green-700">✓ {s.ok}</p> : null;

const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <label className={`block text-sm ${className}`}>
    <span className="mb-1 block text-ink/70">{label}</span>
    {children}
  </label>
);

const Toggle = ({ name, defaultChecked, label }: { name: string; defaultChecked?: boolean; label: string }) => (
  <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
    <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
    <span className="relative h-6 w-11 rounded-full bg-stone-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-green-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-saffron" />
    {label}
  </label>
);

function DeleteButton({ action, what }: { action: () => Promise<void>; what: string }) {
  return (
    <form action={action} onSubmit={(e) => !confirm(`Delete ${what}? This can't be undone.`) && e.preventDefault()}>
      <button className="text-sm text-kumkum hover:underline">Delete</button>
    </form>
  );
}

// ---------- Advance % and booking window ----------

export function RulesForm({ rules }: { rules: { advancePercent: number; minNoticeDays: number; maxMonthsAhead: number } }) {
  const { state, run, pending } = useSave(saveRulesAction);
  const [pct, setPct] = useState(rules.advancePercent);
  const example = 5_000_000; // ₹50,000
  return (
    <form action={run} className="space-y-5">
      <div>
        <div className="flex items-end justify-between gap-4">
          <span className="text-sm text-ink/70">Advance to be paid online (अग्रिम राशि)</span>
          <span className="font-display text-4xl tabular-nums text-kumkum">{pct}%</span>
        </div>
        <input type="range" min={0} max={100} step={5} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="mt-2 w-full accent-[#e8820c]" aria-label="Advance percent" />
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <input name="advancePercent" type="number" min={0} max={100} value={pct} onChange={(e) => setPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} className="admin-input w-24" />
          <span className="text-ink/60">
            Example: a {inr(example)} booking → customer pays <b>{inr(advanceFor(example, pct))}</b> now, {inr(example - advanceFor(example, pct))} later.
          </span>
        </div>
        {pct === 0 && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">0% = no online payment. Customers send a booking request and you confirm it from Show Bookings.</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Minimum notice (days before the event)">
          <input name="minNoticeDays" type="number" min={0} max={60} defaultValue={rules.minNoticeDays} className="admin-input" />
        </Field>
        <Field label="Customers can book up to (months ahead)">
          <input name="maxMonthsAhead" type="number" min={1} max={36} defaultValue={rules.maxMonthsAhead} className="admin-input" />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <button className={btn} disabled={pending}>
          {pending ? "Saving…" : "Save rules"}
        </button>
        <Msg s={state} />
      </div>
    </form>
  );
}

// ---------- Programmes ----------

type ServiceRowT = { id: string; name: string; nameHi: string | null; description: string | null; basePrice: number; active: boolean; sortOrder: number };

export function ServiceForm({ s }: { s?: ServiceRowT }) {
  const { ref, state, run, pending } = useSave(saveService, !s);
  return (
    <div className="space-y-3">
      <form ref={ref} action={run} className="grid gap-3 md:grid-cols-6">
        {s && <input type="hidden" name="id" value={s.id} />}
        <Field label="Name (English)" className="md:col-span-2">
          <input name="name" required defaultValue={s?.name} placeholder="Musical Sundarkand" className="admin-input" />
        </Field>
        <Field label="नाम (हिंदी)" className="md:col-span-2">
          <input name="nameHi" defaultValue={s?.nameHi ?? ""} placeholder="संगीतमय सुन्दरकाण्ड" className="admin-input" />
        </Field>
        <Field label="Base price (₹)" className="md:col-span-1">
          <input name="basePrice" type="number" min={0} step={1} required defaultValue={s ? s.basePrice / 100 : ""} placeholder="51000" className="admin-input" />
        </Field>
        <Field label="Order" className="md:col-span-1">
          <input name="sortOrder" type="number" defaultValue={s?.sortOrder ?? 0} className="admin-input" />
        </Field>
        <Field label="Short description (optional)" className="md:col-span-6">
          <input name="description" defaultValue={s?.description ?? ""} className="admin-input" />
        </Field>
        <div className="flex flex-wrap items-center gap-4 md:col-span-6">
          <Toggle name="active" defaultChecked={s ? s.active : true} label="Show to customers" />
          <button className={btn} disabled={pending}>
            {pending ? "Saving…" : s ? "Save" : "+ Add programme"}
          </button>
          <Msg s={state} />
        </div>
      </form>
      {s && <DeleteButton action={deleteService.bind(null, s.id)} what={`"${s.name}"`} />}
    </div>
  );
}

// ---------- Locations ----------

type LocationRowT = { id: string; name: string; travelCost: number; note: string | null; active: boolean; sortOrder: number };

export function LocationForm({ l }: { l?: LocationRowT }) {
  const { ref, state, run, pending } = useSave(saveLocation, !l);
  return (
    <div className="space-y-3">
      <form ref={ref} action={run} className="grid gap-3 md:grid-cols-6">
        {l && <input type="hidden" name="id" value={l.id} />}
        <Field label="City / area" className="md:col-span-2">
          <input name="name" required defaultValue={l?.name} placeholder="Ujjain (उज्जैन)" className="admin-input" />
        </Field>
        <Field label="Travelling expense (₹)" className="md:col-span-1">
          <input name="travelCost" type="number" min={0} step={1} required defaultValue={l ? l.travelCost / 100 : ""} placeholder="0" className="admin-input" />
        </Field>
        <Field label="Note for customer (optional)" className="md:col-span-2">
          <input name="note" defaultValue={l?.note ?? ""} placeholder="Includes team travel & stay" className="admin-input" />
        </Field>
        <Field label="Order" className="md:col-span-1">
          <input name="sortOrder" type="number" defaultValue={l?.sortOrder ?? 0} className="admin-input" />
        </Field>
        <div className="flex flex-wrap items-center gap-4 md:col-span-6">
          <Toggle name="active" defaultChecked={l ? l.active : true} label="Show to customers" />
          <button className={btn} disabled={pending}>
            {pending ? "Saving…" : l ? "Save" : "+ Add location"}
          </button>
          <Msg s={state} />
        </div>
      </form>
      {l && <DeleteButton action={deleteLocation.bind(null, l.id)} what={`"${l.name}"`} />}
    </div>
  );
}

// ---------- Questions ----------

type QuestionRowT = PublicQuestion & { active: boolean; sortOrder: number };
const newId = () => Math.random().toString(36).slice(2, 8);

export function QuestionForm({ q, services }: { q?: QuestionRowT; services: { id: string; name: string }[] }) {
  const { ref, state, run, pending } = useSave(async (p, fd) => {
    const r = await saveQuestion(p, fd);
    if (!q && r?.ok) {
      setKind("CHOICE");
      setOptions(blankOptions());
      setOnly([]);
    }
    return r;
  }, !q);
  const blankOptions = (): (Omit<ChoiceOption, "price"> & { price: string })[] => [
    { id: newId(), label: "", price: "0" },
    { id: newId(), label: "", price: "0" },
  ];
  const [kind, setKind] = useState<PublicQuestion["kind"]>(q?.kind ?? "CHOICE");
  const [options, setOptions] = useState(q?.options.length ? q.options.map((o) => ({ ...o, price: String(o.price / 100) })) : blankOptions());
  const [only, setOnly] = useState<string[]>(q?.serviceIds ?? []);

  const setOpt = (i: number, patch: Partial<(typeof options)[number]>) => setOptions((o) => o.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="space-y-3">
      <form ref={ref} action={run} className="space-y-4">
        {q && <input type="hidden" name="id" value={q.id} />}
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="options" value={JSON.stringify(options.map((o) => ({ ...o, price: Number(o.price) || 0 })))} />
        <input type="hidden" name="serviceIds" value={only.join(",")} />

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="सवाल (हिंदी), shown first">
            <input name="labelHi" defaultValue={q?.labelHi ?? ""} placeholder="आयोजन में कितने लोग होंगे?" className="admin-input" />
          </Field>
          <Field label="Question (English)">
            <input name="label" required defaultValue={q?.label} placeholder="How many people are expected?" className="admin-input" />
          </Field>
          <Field label="Help text (optional)" className="md:col-span-2">
            <input name="help" defaultValue={q?.help ?? ""} placeholder="Approximate number is fine" className="admin-input" />
          </Field>
        </div>

        <div>
          <span className="mb-1 block text-sm text-ink/70">Answer type</span>
          <div className="inline-flex rounded-full bg-[#f3ead8] p-1 text-sm">
            {(
              [
                ["CHOICE", "Options (with price)"],
                ["NUMBER", "Number (price per unit)"],
                ["TEXT", "Text (no price)"],
              ] as const
            ).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-full px-4 py-1.5 transition-colors ${kind === k ? "bg-white shadow" : "text-ink/60"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {kind === "CHOICE" && (
          <div className="space-y-2 rounded-2xl bg-[#faf5ea] p-4">
            <div className="grid grid-cols-[1fr_140px_32px] gap-2 text-xs uppercase tracking-widest text-ink/50">
              <span>Option shown to customer</span>
              <span>Adds to price (₹)</span>
              <span />
            </div>
            {options.map((o, i) => (
              <div key={o.id} className="grid grid-cols-[1fr_140px_32px] items-center gap-2">
                <input value={o.label} onChange={(e) => setOpt(i, { label: e.target.value })} placeholder={`Option ${i + 1}, e.g. 100 – 500 लोग`} className="admin-input" />
                <input value={o.price} onChange={(e) => setOpt(i, { price: e.target.value })} type="number" min={0} className="admin-input" />
                <button type="button" aria-label="Remove option" disabled={options.length <= 2} onClick={() => setOptions((x) => x.filter((_, j) => j !== i))} className="h-8 w-8 rounded-full text-kumkum hover:bg-red-50 disabled:opacity-30">
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setOptions((x) => [...x, { id: newId(), label: "", price: "0" }])} className={btnGhost}>
              + Add option
            </button>
          </div>
        )}

        {kind === "NUMBER" && (
          <div className="grid gap-3 rounded-2xl bg-[#faf5ea] p-4 sm:grid-cols-4">
            <Field label="Price per unit (₹)">
              <input name="unitPrice" type="number" min={0} defaultValue={q ? q.unitPrice / 100 : 0} className="admin-input" />
            </Field>
            <Field label="Included free (units)">
              <input name="freeUnits" type="number" min={0} defaultValue={q?.freeUnits ?? 0} className="admin-input" />
            </Field>
            <Field label="Minimum (optional)">
              <input name="minValue" type="number" min={0} defaultValue={q?.minValue ?? ""} className="admin-input" />
            </Field>
            <Field label="Maximum (optional)">
              <input name="maxValue" type="number" min={0} defaultValue={q?.maxValue ?? ""} className="admin-input" />
            </Field>
            <p className="text-xs text-ink/55 sm:col-span-4">Example: ₹20 per unit with 100 included → 300 guests adds (300 − 100) × ₹20 = ₹4,000.</p>
          </div>
        )}

        <div>
          <span className="mb-1 block text-sm text-ink/70">Ask this for</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setOnly([])} className={`rounded-full border px-3 py-1 text-sm ${only.length === 0 ? "border-saffron bg-saffron/15" : "border-[#e3d6bf]"}`}>
              All programmes
            </button>
            {services.map((s) => {
              const on = only.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setOnly((x) => (on ? x.filter((y) => y !== s.id) : [...x, s.id]))}
                  className={`rounded-full border px-3 py-1 text-sm ${on ? "border-saffron bg-saffron/15" : "border-[#e3d6bf]"}`}
                >
                  {on ? "✓ " : ""}
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Toggle name="required" defaultChecked={q ? q.required : true} label="Required" />
          <Toggle name="active" defaultChecked={q ? q.active : true} label="Show to customers" />
          <label className="flex items-center gap-2 text-sm text-ink/70">
            Order <input name="sortOrder" type="number" defaultValue={q?.sortOrder ?? 0} className="admin-input w-20" />
          </label>
          <button className={btn} disabled={pending}>
            {pending ? "Saving…" : q ? "Save question" : "+ Add question"}
          </button>
          <Msg s={state} />
        </div>
      </form>
      {q && <DeleteButton action={deleteQuestion.bind(null, q.id)} what="this question" />}
    </div>
  );
}
