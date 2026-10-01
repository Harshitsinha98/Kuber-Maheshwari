"use client";

import { useActionState, useRef } from "react";
import { addTestimonial, type FormState } from "../actions";
import { btn } from "../ui";

export default function TestimonialForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(async (p, fd) => {
    const r = await addTestimonial(p, fd);
    if (!r?.error) ref.current?.reset();
    return r;
  }, undefined);
  return (
    <form ref={ref} action={action} className="grid gap-3 md:grid-cols-3">
      <label className="text-sm md:col-span-3">
        <span className="mb-1 block text-ink/70">Message (Hindi or English) *</span>
        <textarea name="text" required rows={3} className="admin-input font-hindi" placeholder="सुन्दरकाण्ड का भावार्थ सुनकर पूरा परिवार भावविभोर हो गया…" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">Name *</span>
        <input name="name" required className="admin-input" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">City</span>
        <input name="place" className="admin-input" placeholder="Indore" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">Occasion</span>
        <input name="occasion" className="admin-input" placeholder="Sundarkand at home" />
      </label>
      <div className="md:col-span-3">
        <button className={btn} disabled={pending}>
          {pending ? "Saving…" : "Add testimonial"}
        </button>
        {state?.error && <span className="ml-3 text-sm text-red-700">{state.error}</span>}
      </div>
    </form>
  );
}
