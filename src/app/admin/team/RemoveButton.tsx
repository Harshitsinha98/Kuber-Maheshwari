"use client";

import { useTransition } from "react";
import { removeTeamMember } from "./actions";

export default function RemoveButton({ id, email }: { id: string; email: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Remove ${email} from the team? They will lose admin access immediately.`)) start(() => removeTeamMember(id));
      }}
      className="text-sm text-kumkum hover:underline disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
