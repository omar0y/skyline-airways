"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import type { BookingActionState } from "@/lib/actions/booking";

type Seat = {
  id: number;
  seatNo: string;
  seatClass: string;
  status: string;
  price: number;
  bookingId: number | null;
};

const initial: BookingActionState = { ok: false };

export function SeatMap({
  seats,
  bookingRef,
  bookingId,
  needed,
  action,
}: {
  seats: Seat[];
  bookingRef: string;
  bookingId: number;
  needed: number;
  action: (prev: BookingActionState, formData: FormData) => Promise<BookingActionState>;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [state, formAction, pending] = useActionState(action, initial);

  const rows = useMemo(() => {
    const map = new Map<number, Seat[]>();
    for (const seat of seats) {
      const row = Number(seat.seatNo.replace(/\D/g, ""));
      if (!map.has(row)) map.set(row, []);
      map.get(row)!.push(seat);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [seats]);

  function toggle(seat: Seat) {
    const taken =
      seat.status === "SOLD" ||
      (seat.status === "HELD" && seat.bookingId !== bookingId);
    if (taken) return;

    setSelected((prev) => {
      if (prev.includes(seat.id)) return prev.filter((id) => id !== seat.id);
      if (prev.length >= needed) return prev;
      return [...prev, seat.id];
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="bookingRef" value={bookingRef} />
      {selected.map((id) => (
        <input key={id} type="hidden" name="seatId" value={id} />
      ))}

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

      <p className="text-sm">
        Select {needed} seat{needed > 1 ? "s" : ""}. Selected: {selected.length}/{needed}
      </p>

      <div className="surface overflow-x-auto p-4">
        <div className="mb-4 flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-secondary" /> Available
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-accent" /> Selected
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-muted-foreground/40" /> Unavailable
          </span>
        </div>
        <div className="space-y-2">
          {rows.map(([row, rowSeats]) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-6 text-xs font-bold text-primary">{row}</span>
              <div className="flex flex-wrap gap-1">
                {rowSeats
                  .sort((a, b) => a.seatNo.localeCompare(b.seatNo))
                  .map((seat) => {
                    const taken =
                      seat.status === "SOLD" ||
                      (seat.status === "HELD" && seat.bookingId !== bookingId);
                    const isSelected = selected.includes(seat.id);
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        onClick={() => toggle(seat)}
                        disabled={taken}
                        title={`${seat.seatNo} · ${seat.seatClass}`}
                        className={`h-10 min-w-10 cursor-pointer rounded px-1 text-xs font-bold transition-colors duration-150 ${
                          taken
                            ? "cursor-not-allowed bg-muted text-muted-foreground/50"
                            : isSelected
                              ? "bg-accent text-on-accent"
                              : "bg-secondary text-white hover:bg-primary"
                        }`}
                        aria-pressed={isSelected}
                        aria-label={`Seat ${seat.seatNo} ${seat.seatClass}`}
                      >
                        {seat.seatNo.replace(String(row), "")}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={pending || selected.length !== needed}
      >
        {pending ? "Holding seats…" : "Hold seats & continue"}
      </button>
    </form>
  );
}
