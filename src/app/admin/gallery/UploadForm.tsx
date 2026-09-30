"use client";

import { useActionState, useRef } from "react";
import { addGalleryImages, type FormState } from "../actions";
import { btn } from "../ui";

export default function UploadForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(async (p, fd) => {
    const r = await addGalleryImages(p, fd);
    if (!r?.error) ref.current?.reset();
    return r;
  }, undefined);
  return (
    <form ref={ref} action={action} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">Photos (multiple allowed)</span>
        <input type="file" name="files" accept="image/*" multiple className="admin-input" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">…or image URL</span>
        <input name="url" className="admin-input" placeholder="https://…" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">Caption (optional)</span>
        <input name="caption" className="admin-input" />
      </label>
      <button className={btn} disabled={pending}>
        {pending ? "Uploading…" : "Add"}
      </button>
      {state?.error && <p className="text-sm text-red-700 md:col-span-4">{state.error}</p>}
    </form>
  );
}
