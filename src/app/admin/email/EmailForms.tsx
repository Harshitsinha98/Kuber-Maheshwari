"use client";

import { useActionState } from "react";
import { sendTestEmailAction, type EmailActionState } from "../actions";
import { btn } from "../ui";

function Msg({ state }: { state: EmailActionState }) {
  if (!state) return null;
  return <p className={`mt-3 rounded-lg p-3 text-sm ${state.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"}`}>{state.error || state.ok}</p>;
}

export function TestEmailForm({ defaultTo, disabled }: { defaultTo: string; disabled?: boolean }) {
  const [state, action, pending] = useActionState(sendTestEmailAction, undefined);
  return (
    <form action={action}>
      <div className="flex flex-wrap gap-2">
        <input name="to" type="email" required defaultValue={defaultTo} className="admin-input max-w-sm" />
        <button className={btn} disabled={pending || disabled}>
          {pending ? "Sending…" : "Send test email"}
        </button>
      </div>
      {disabled && <p className="mt-2 text-xs text-ink/50">Add RESEND_API_KEY first.</p>}
      <Msg state={state} />
    </form>
  );
}

export function EmailActionButton({
  action: run,
  label,
  disabled,
}: {
  action: () => Promise<EmailActionState>;
  label: string;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(run, undefined);
  return (
    <form action={action}>
      <button className={btn} disabled={pending || disabled}>
        {pending ? "Working…" : label}
      </button>
      <Msg state={state} />
    </form>
  );
}
