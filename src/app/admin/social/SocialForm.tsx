"use client";

import { useActionState, useState, useTransition } from "react";
import { refreshSocialNow, saveSocial } from "../actions";
import { btn, btnGhost } from "../ui";

export default function SocialForm() {
  const [state, action, pending] = useActionState(saveSocial, undefined);
  const [msg, setMsg] = useState<string | null>(null);
  const [refreshing, start] = useTransition();
  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-ink/70">Instagram long-lived access token</span>
        <input name="instagram_token" type="password" className="admin-input font-mono" autoComplete="off" placeholder="IGAA…" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Facebook Page ID</span>
          <input name="facebook_page_id" className="admin-input font-mono" placeholder="1234567890" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Facebook Page access token</span>
          <input name="facebook_page_token" type="password" className="admin-input font-mono" autoComplete="off" placeholder="EAAG…" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className={btn} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className={btnGhost}
          disabled={refreshing}
          onClick={() =>
            start(async () => {
              const r = await refreshSocialNow();
              setMsg(r.ok ? `Token renewed (valid ~${"expiresInDays" in r ? r.expiresInDays : 60} days). Feeds refreshed.` : `Refresh failed: ${"reason" in r ? r.reason : ""}`);
            })
          }
        >
          {refreshing ? "Refreshing…" : "Refresh now"}
        </button>
        {(state?.ok || state?.error || msg) && <span className="text-sm text-ink/70">{state?.error || msg || state?.ok}</span>}
      </div>
    </form>
  );
}
