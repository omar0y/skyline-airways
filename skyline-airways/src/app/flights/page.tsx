import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { SearchForm } from "@/components/SearchForm";
import { FlightCard } from "@/components/FlightCard";
import { FlightGridMotion } from "@/components/FlightGridMotion";
import { BookingStepper } from "@/components/BookingStepper";

export const metadata = { title: "Flights" };

async function FlightResults({
  source,
  destination,
  travelDate,
  passengers,
  seatClass,
  maxPrice,
}: {
  source?: string;
  destination?: string;
  travelDate?: string;
  passengers: number;
  seatClass?: string;
  maxPrice?: string;
}) {
  const dayStart = travelDate ? new Date(`${travelDate}T00:00:00`) : undefined;
  const dayEnd = travelDate ? new Date(`${travelDate}T23:59:59`) : undefined;

  const flights = await prisma.flight.findMany({
    where: {
      status: { in: ["SCHEDULED", "DELAYED"] },
      ...(source ? { departure: { code: source.toUpperCase() } } : {}),
      ...(destination ? { arrival: { code: destination.toUpperCase() } } : {}),
      ...(dayStart && dayEnd
        ? { departureTime: { gte: dayStart, lte: dayEnd } }
        : {}),
      ...(maxPrice ? { basePrice: { lte: Number(maxPrice) } } : {}),
      ...(seatClass
        ? {
            seats: {
              some: { seatClass: seatClass.toUpperCase(), status: "AVAILABLE" },
            },
          }
        : {}),
    },
    include: {
      departure: true,
      arrival: true,
      seats: {
        where: { status: "AVAILABLE" },
        select: { id: true },
      },
    },
    orderBy: { departureTime: "asc" },
    take: 40,
  });

  const available = flights.filter((f) => f.seats.length >= passengers);

  if (!available.length) {
    return (
      <div className="surface p-8 text-center">
        <h2 className="text-xl font-bold text-primary">No flights found</h2>
        <p className="mt-2 text-sm">
          Try another date or route. Seeded demo routes include CAI–DXB, DXB–LHR, and more.
        </p>
      </div>
    );
  }

  return (
    <FlightGridMotion>
      {available.map((flight) => (
        <FlightCard key={flight.id} flight={flight} passengers={passengers} />
      ))}
    </FlightGridMotion>
  );
}

export default async function FlightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const passengers = Math.min(9, Math.max(1, Number(params.passengers || 1)));
  const airports = await prisma.airport.findMany({ orderBy: { city: "asc" } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <BookingStepper current={params.source ? 2 : 1} />
      <h1 className="mb-2 text-3xl font-bold text-primary">Search results</h1>
      <p className="mb-6 text-sm">Filter by class and price, then select a flight.</p>

      <div className="surface mb-8 p-5">
        <SearchForm
          airports={airports}
          defaults={{
            source: params.source,
            destination: params.destination,
            travelDate: params.travelDate,
            passengers: String(passengers),
          }}
          compact
        />
        <form
          action="/flights"
          method="get"
          className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-3"
        >
          <input type="hidden" name="source" value={params.source || ""} />
          <input type="hidden" name="destination" value={params.destination || ""} />
          <input type="hidden" name="travelDate" value={params.travelDate || ""} />
          <input type="hidden" name="passengers" value={String(passengers)} />
          <div className="field">
            <label htmlFor="seatClass">Cabin class</label>
            <select id="seatClass" name="seatClass" defaultValue={params.seatClass || ""}>
              <option value="">Any</option>
              <option value="ECONOMY">Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="maxPrice">Max price (USD)</label>
            <input
              id="maxPrice"
              name="maxPrice"
              type="number"
              min={50}
              defaultValue={params.maxPrice || ""}
              placeholder="e.g. 400"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn btn-ghost w-full">
              Apply filters
            </button>
          </div>
        </form>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="surface h-36 animate-pulse bg-muted" />
            ))}
          </div>
        }
      >
        <FlightResults
          source={params.source}
          destination={params.destination}
          travelDate={params.travelDate}
          passengers={passengers}
          seatClass={params.seatClass}
          maxPrice={params.maxPrice}
        />
      </Suspense>
    </div>
  );
}
