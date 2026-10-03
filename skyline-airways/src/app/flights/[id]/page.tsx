import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BookingStepper } from "@/components/BookingStepper";
import {
  durationLabel,
  formatDateTime,
  formatMoney,
} from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flight = await prisma.flight.findUnique({ where: { id: Number(id) } });
  return { title: flight ? `Flight ${flight.flightNo}` : "Flight" };
}

export default async function FlightDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ passengers?: string }>;
}) {
  const { id } = await params;
  const { passengers: p } = await searchParams;
  const passengers = Math.min(9, Math.max(1, Number(p || 1)));
  const user = await getCurrentUser();

  const flight = await prisma.flight.findUnique({
    where: { id: Number(id) },
    include: {
      departure: true,
      arrival: true,
      aircraft: true,
      connection: {
        include: { departure: true, arrival: true },
      },
      seats: true,
    },
  });

  if (!flight) notFound();

  const available = flight.seats.filter((s) => s.status === "AVAILABLE").length;
  const byClass = ["FIRST", "BUSINESS", "ECONOMY"].map((seatClass) => ({
    seatClass,
    count: flight.seats.filter((s) => s.seatClass === seatClass && s.status === "AVAILABLE")
      .length,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <BookingStepper current={2} />
      <h1 className="text-3xl font-bold text-primary">{flight.flightNo}</h1>
      <p className="mt-2 text-muted-foreground">
        {flight.departure.city} ({flight.departure.code}) → {flight.arrival.city} (
        {flight.arrival.code})
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="surface p-5">
          <h2 className="mb-3 font-bold text-primary">Schedule</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt>Departure</dt>
              <dd className="font-bold text-foreground">
                {formatDateTime(flight.departureTime)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Arrival</dt>
              <dd className="font-bold text-foreground">
                {formatDateTime(flight.arrivalTime)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Duration</dt>
              <dd>{durationLabel(flight.departureTime, flight.arrivalTime)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Aircraft</dt>
              <dd>
                {flight.aircraft.model} · {flight.aircraft.capacity} seats
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Status</dt>
              <dd>{flight.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Miles</dt>
              <dd>{flight.miles}</dd>
            </div>
          </dl>
        </div>

        <div className="surface p-5">
          <h2 className="mb-3 font-bold text-primary">Seat availability</h2>
          <p className="mb-4 text-sm">{available} seats open</p>
          <ul className="space-y-2 text-sm">
            {byClass.map((c) => (
              <li key={c.seatClass} className="flex justify-between">
                <span>{c.seatClass}</span>
                <span className="font-bold text-foreground">{c.count} open</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-2xl font-bold text-primary">
            from {formatMoney(flight.basePrice)}
          </p>
        </div>
      </div>

      {flight.connection ? (
        <div className="surface mt-4 p-5 text-sm">
          <h2 className="mb-2 font-bold text-primary">Connecting flight</h2>
          <p>
            {flight.connection.flightNo}: {flight.connection.departure.code} →{" "}
            {flight.connection.arrival.code} at{" "}
            {formatDateTime(flight.connection.departureTime)}
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {user ? (
          <Link
            href={`/book/${flight.id}?passengers=${passengers}`}
            className="btn btn-primary"
          >
            Continue with {passengers} passenger{passengers > 1 ? "s" : ""}
          </Link>
        ) : (
          <Link
            href={`/auth/login`}
            className="btn btn-primary"
          >
            Sign in to book
          </Link>
        )}
        <Link href="/flights" className="btn btn-ghost">
          Back to results
        </Link>
      </div>
    </div>
  );
}
