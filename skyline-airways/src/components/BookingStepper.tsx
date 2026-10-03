const STEPS = ["Search", "Flight", "Passengers", "Seats", "Pay", "Confirm"] as const;

export function BookingStepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex flex-wrap gap-2" aria-label="Booking progress">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const active = step === current;
        const done = step < current;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${
              active
                ? "bg-accent text-on-accent"
                : done
                  ? "bg-primary text-on-primary"
                  : "bg-muted text-muted-foreground"
            }`}
            aria-current={active ? "step" : undefined}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
              {step}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
