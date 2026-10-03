import Link from "next/link";
import { AirplaneTakeoff, Clock } from "@phosphor-icons/react/dist/ssr";
import {
  durationLabel,
  formatDate,
  formatMoney,
  formatTime,
} from "@/lib/format";

type FlightCardProps = {
  flight: {
    id: string | number;
    flightNo: string;
    departureTime: Date | string;
    arrivalTime: Date | string;
    basePrice: number;
    currency?: string;
    status: string;
    miles: number;
    detail?: string;
    departure: { code: string; city: string };
    arrival: { code: string; city: string };
  };
  passengers?: number;
  href?: string;
  actionLabel?: string;
};

export function FlightCard({
  flight,
  passengers = 1,
  href,
  actionLabel = "Select flight",
}: FlightCardProps) {
  return (
    <article className="grid-item surface flex flex-col gap-4 p-5 transition-shadow duration-200 hover:shadow-md md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <AirplaneTakeoff size={18} aria-hidden="true" />
          {flight.flightNo}
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {flight.status}
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-4 text-foreground">
          <div>
            <p className="text-2xl font-bold">{formatTime(flight.departureTime)}</p>
            <p className="text-sm">
              {flight.departure.code} · {flight.departure.city}
            </p>
          </div>
          <div className="pb-1 text-sm text-muted-foreground">
            <Clock size={14} className="mb-1 inline" aria-hidden="true" />{" "}
            {durationLabel(flight.departureTime, flight.arrivalTime)}
          </div>
          <div>
            <p className="text-2xl font-bold">{formatTime(flight.arrivalTime)}</p>
            <p className="text-sm">
              {flight.arrival.code} · {flight.arrival.city}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDate(flight.departureTime)}
          {flight.detail
            ? ` · ${flight.detail}`
            : flight.miles
              ? ` · ${flight.miles} miles`
              : ""}
        </p>
      </div>
      <div className="flex flex-col items-start gap-3 md:items-end">
        <p className="text-2xl font-bold text-primary">
          {formatMoney(flight.basePrice, flight.currency)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">/ adult</span>
        </p>
        <Link
          href={href ?? `/flights/${flight.id}?passengers=${passengers}`}
          className="btn btn-primary"
        >
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}
