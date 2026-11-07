"use client";

import { useActionState, useState } from "react";
import {
  cancelShowBookingAction,
  confirmShowBookingAction,
  recordPaymentAction,
  saveAdminNoteAction,
  type ActionState,
} from "../../booking-actions";
import { Card, btn, btnGhost } from "../../ui";

const Msg = ({ s }: { s: ActionState }) =>
  s?.error ? <p className="text-sm text-red-700">{s.error}</p> : s?.ok ? <p className="text-sm text-green-700">✓ {s.ok}</p> : null;

export default function BookingActions({ id, status, date, paid, total, note }: { id: string; status: string; date: string; paid: number; total: number; note: string }) {
  const [cState, confirmIt, cPending] = useActionState<ActionState, FormData>(confirmShowBookingAction.bind(null, id), undefined);
  const [xState, cancelIt, xPending] = useActionState<ActionState, FormData>(async () => cancelShowBookingAction(id), undefined);
  const [pState, pay, pPending] = useActionState<ActionState, FormData>(recordPaymentAction.bind(null, id), undefined);
  const [nState, saveNote, nPending] = useActionState<ActionState, FormData>(saveAdminNoteAction.bind(null, id), undefined);
  const [move, setMove] = useState(status === "CONFLICT");
  const open = status !== "CANCELLED";

  return (
    <div className="space-y-4">
      {(status === "REQUESTED" || status === "CONFLICT" || status === "FAILED" || status === "CONFIRMED") && open && (
        <Card>
          <p className="font-display text-xl">{status === "CONFIRMED" ? "Change date" : "Confirm booking"}</p>
          <form action={confirmIt} className="mt-3 space-y-3">
            {status !== "CONFIRMED" && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={move} onChange={(e) => setMove(e.target.checked)} /> Move to a different date
              </label>
            )}
            {(move || status === "CONFIRMED") && <input type="date" name="date" defaultValue={date} required className="admin-input" />}
            <button className={btn} disabled={cPending}>
              {cPending ? "Checking date…" : status === "CONFIRMED" ? "Move booking" : "Confirm & lock date"}
            </button>
            <p className="text-xs text-ink/50">The date is checked again at this moment. If it&apos;s already booked or blocked you&apos;ll see an error and nothing changes.</p>
            <Msg s={cState} />
          </form>
        </Card>
      )}

      {open && (
        <Card>
          <p className="font-display text-xl">Payment received</p>
          <form action={pay} className="mt-3 flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <span className="mb-1 block text-ink/70">Total received so far (₹)</span>
              <input name="paid" type="number" min={0} defaultValue={paid / 100} className="admin-input w-40" />
            </label>
            <button className={btnGhost} disabled={pPending}>
              Save
            </button>
            <button type="submit" name="full" value="1" className={btnGhost} disabled={pPending || paid >= total}>
              Mark fully paid
            </button>
          </form>
          <div className="mt-2">
            <Msg s={pState} />
          </div>
        </Card>
      )}

      <Card>
        <p className="font-display text-xl">Private note</p>
        <form action={saveNote} className="mt-3 space-y-2">
          <textarea name="note" rows={3} defaultValue={note} placeholder="Only the team sees this" className="admin-input" />
          <button className={btnGhost} disabled={nPending}>
            Save note
          </button>
          <Msg s={nState} />
        </form>
      </Card>

      {open && (
        <Card>
          <form action={cancelIt} onSubmit={(e) => !confirm("Cancel this booking? The date becomes free again on the website.") && e.preventDefault()}>
            <button className="text-sm font-medium text-kumkum hover:underline" disabled={xPending}>
              {xPending ? "Cancelling…" : "Cancel booking & free the date"}
            </button>
          </form>
          <p className="mt-1 text-xs text-ink/50">Refunds are made from the Razorpay dashboard.</p>
          <Msg s={xState} />
        </Card>
      )}
    </div>
  );
}
