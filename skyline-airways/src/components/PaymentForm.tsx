"use client";

import { useActionState } from "react";
import type { BookingActionState } from "@/lib/actions/booking";
import { formatMoney } from "@/lib/format";

const initial: BookingActionState = { ok: false };

export function PaymentForm({
  bookingRef,
  totalPrice,
  miles,
  action,
}: {
  bookingRef: string;
  totalPrice: number;
  miles: number;
  action: (prev: BookingActionState, formData: FormData) => Promise<BookingActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      <input type="hidden" name="bookingRef" value={bookingRef} />
      {state.errors?.length ? (
        <div className="error-summary" role="alert" tabIndex={-1}>
          <ul className="list-disc pl-5">
            {state.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-2xl font-bold text-primary">Total {formatMoney(totalPrice)}</p>
      <div className="field">
        <label htmlFor="method">Payment method</label>
        <select id="method" name="method" defaultValue="CARD">
          <option value="CARD">Credit / Debit card (simulated)</option>
          <option value="WALLET">Digital wallet (simulated)</option>
        </select>
      </div>
      {miles > 0 ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="useMiles" className="h-4 w-4" />
          Redeem up to {miles} miles (10 miles = $1)
        </label>
      ) : null}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Authorizing…" : "Authorize payment & issue tickets"}
      </button>
    </form>
  );
}
