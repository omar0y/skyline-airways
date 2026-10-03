"use client";

import { useActionState } from "react";
import type { DuffelBookingState } from "@/lib/actions/duffel-booking";

const initial: DuffelBookingState = { ok: false };

export function DuffelPassengerForm({
  offerId,
  passengers,
  email,
  action,
}: {
  offerId: string;
  passengers: number;
  email: string;
  action: (prev: DuffelBookingState, formData: FormData) => Promise<DuffelBookingState>;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="offerId" value={offerId} />

      {state.errors?.length ? (
        <div className="error-summary" role="alert" tabIndex={-1}>
          <h2 className="mb-2 font-bold">There is a problem</h2>
          <ul className="list-disc pl-5">
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {Array.from({ length: passengers }).map((_, i) => (
        <fieldset key={i} className="surface space-y-4 p-5">
          <legend className="px-1 font-bold text-primary">Passenger {i + 1}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor={`title_${i}`}>Title</label>
              <select id={`title_${i}`} name={`title_${i}`} defaultValue="mr" required>
                <option value="mr">Mr</option>
                <option value="ms">Ms</option>
                <option value="mrs">Mrs</option>
                <option value="miss">Miss</option>
                <option value="dr">Dr</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor={`gender_${i}`}>Gender</label>
              <select id={`gender_${i}`} name={`gender_${i}`} defaultValue="m" required>
                <option value="m">Male</option>
                <option value="f">Female</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor={`firstName_${i}`}>First name</label>
              <input id={`firstName_${i}`} name={`firstName_${i}`} required autoComplete="given-name" />
            </div>
            <div className="field">
              <label htmlFor={`lastName_${i}`}>Last name</label>
              <input id={`lastName_${i}`} name={`lastName_${i}`} required autoComplete="family-name" />
            </div>
            <div className="field">
              <label htmlFor={`dateOfBirth_${i}`}>Date of birth</label>
              <input id={`dateOfBirth_${i}`} name={`dateOfBirth_${i}`} type="date" required />
            </div>
            <div className="field">
              <label htmlFor={`nationality_${i}`}>Nationality</label>
              <input id={`nationality_${i}`} name={`nationality_${i}`} required placeholder="e.g. Egyptian" />
            </div>
            <div className="field">
              <label htmlFor={`email_${i}`}>Email</label>
              <input
                id={`email_${i}`}
                name={`email_${i}`}
                type="email"
                required
                defaultValue={i === 0 ? email : ""}
              />
            </div>
            <div className="field">
              <label htmlFor={`phone_${i}`}>Phone</label>
              <input
                id={`phone_${i}`}
                name={`phone_${i}`}
                required
                placeholder="+442080160509"
                inputMode="tel"
              />
            </div>
          </div>
        </fieldset>
      ))}

      <p className="text-sm">
        Test mode charges the Duffel balance, not a real card.
      </p>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Booking…" : "Book flight"}
      </button>
    </form>
  );
}
