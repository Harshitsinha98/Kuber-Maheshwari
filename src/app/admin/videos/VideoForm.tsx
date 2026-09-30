"use client";

import { useActionState, useRef } from "react";
import { addVideo, type FormState } from "../actions";
import { btn } from "../ui";

export default function VideoForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(async (p, fd) => {
    const r = await addVideo(p, fd);
    if (!r?.error) ref.current?.reset();
    return r;
  }, undefined);
  return (
    <form ref={ref} action={action} className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">YouTube link</span>
        <input name="url" required className="admin-input" placeholder="https://youtu.be/…" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">Title</span>
        <input name="title" required className="admin-input" />
      </label>
      <button className={btn} disabled={pending}>
        {pending ? "Adding…" : "Add video"}
      </button>
      {state?.error && <p className="text-sm text-red-700 md:col-span-3">{state.error}</p>}
    </form>
  );
}
