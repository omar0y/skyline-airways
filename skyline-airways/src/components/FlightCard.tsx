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
    id: number;
    flightNo: string;
    departureTime: Date;
    arrivalTime: Date;
    basePrice: number;
    status: string;
    miles: number;
    departure: { code: string; city: string };
    arrival: { code: string; city: string };
  };
  passengers?: number;
};

export function FlightCard({ flight, passengers = 1 }: FlightCardProps) {
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
          {formatDate(flight.departureTime)} · {flight.miles} miles
        </p>
      </div>
      <div className="flex flex-col items-start gap-3 md:items-end">
        <p className="text-2xl font-bold text-primary">
          {formatMoney(flight.basePrice)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">/ adult</span>
        </p>
        <Link
          href={`/flights/${flight.id}?passengers=${passengers}`}
          className="btn btn-primary"
        >
          Select flight
        </Link>
      </div>
    </article>
  );
}
