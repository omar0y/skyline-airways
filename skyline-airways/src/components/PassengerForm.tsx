"use client";

import { useActionState } from "react";
import type { BookingActionState } from "@/lib/actions/booking";

const initial: BookingActionState = { ok: false };

export function PassengerForm({
  flightId,
  passengers,
  action,
}: {
  flightId: number;
  passengers: number;
  action: (prev: BookingActionState, formData: FormData) => Promise<BookingActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="flightId" value={flightId} />
      <input type="hidden" name="passengers" value={passengers} />

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

      {Array.from({ length: passengers }).map((_, i) => (
        <fieldset key={i} className="surface space-y-4 p-5">
          <legend className="px-1 font-bold text-primary">Passenger {i + 1}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor={`firstName_${i}`}>First name</label>
              <input id={`firstName_${i}`} name={`firstName_${i}`} required />
            </div>
            <div className="field">
              <label htmlFor={`lastName_${i}`}>Last name</label>
              <input id={`lastName_${i}`} name={`lastName_${i}`} required />
            </div>
            <div className="field">
              <label htmlFor={`dateOfBirth_${i}`}>Date of birth</label>
              <input
                id={`dateOfBirth_${i}`}
                name={`dateOfBirth_${i}`}
                type="date"
                required
              />
            </div>
            <div className="field">
              <label htmlFor={`nationality_${i}`}>Nationality</label>
              <input
                id={`nationality_${i}`}
                name={`nationality_${i}`}
                required
                placeholder="e.g. Egyptian"
              />
            </div>
          </div>
        </fieldset>
      ))}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Reserving…" : "Reserve & choose seats"}
      </button>
    </form>
  );
}
