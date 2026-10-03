"use client";

import { useActionState } from "react";
import type { CheckInState } from "@/lib/actions/checkin";

const initial: CheckInState = { ok: false };

export function CheckInForm({
  action,
  defaultRef,
}: {
  action: (prev: CheckInState, formData: FormData) => Promise<CheckInState>;
  defaultRef?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      {state.errors?.length ? (
        <div className="error-summary" role="alert" tabIndex={-1}>
          <h2 className="mb-2 font-bold">There is a problem</h2>
          <ul className="list-disc pl-5">
            {state.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {state.ok && state.message ? (
        <div className="rounded border border-border bg-muted p-4 text-foreground">
          <p className="font-bold">{state.message}</p>
          {state.gate ? <p className="mt-1 text-sm">Boarding gate: {state.gate}</p> : null}
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="bookingRef">Booking reference</label>
        <input
          id="bookingRef"
          name="bookingRef"
          required
          defaultValue={defaultRef || ""}
          placeholder="e.g. SLAB12CD"
        />
      </div>
      <div className="field">
        <label htmlFor="lastName">Passenger last name</label>
        <input id="lastName" name="lastName" required />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Checking in…" : "Check in"}
      </button>
    </form>
  );
}
