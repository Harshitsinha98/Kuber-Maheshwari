"use client";

import { useActionState, useRef, useState } from "react";
import { compressImage } from "@/lib/compress-image";
import { addGalleryImages, type FormState } from "../actions";
import { btn } from "../ui";

export default function UploadForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    const caption = String(fd.get("caption") || "");
    const url = String(fd.get("url") || "").trim();

    // One photo per request keeps each upload small (Vercel limits request size).
    let result: FormState = prev;
    for (const [i, f] of files.entries()) {
      setProgress(`Uploading ${i + 1} of ${files.length}…`);
      const one = new FormData();
      one.append("files", await compressImage(f));
      one.append("caption", caption);
      result = await addGalleryImages(prev, one);
      if (result?.error) break;
    }
    if (url && !result?.error) {
      const one = new FormData();
      one.append("url", url);
      one.append("caption", caption);
      result = await addGalleryImages(prev, one);
    }
    if (!files.length && !url) result = { error: "Choose images or paste an image URL" };
    setProgress(null);
    if (!result?.error) ref.current?.reset();
    return result;
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
        {pending ? progress || "Uploading…" : "Add"}
      </button>
      {state?.error && <p className="text-sm text-red-700 md:col-span-4">{state.error}</p>}
    </form>
  );
}
