import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { searchDuffelFlights } from "@/lib/duffel";
import { SearchForm } from "@/components/SearchForm";
import { FlightCard } from "@/components/FlightCard";
import { FlightGridMotion } from "@/components/FlightGridMotion";
import { BookingStepper } from "@/components/BookingStepper";

export const metadata = { title: "Flights" };
export const dynamic = "force-dynamic";

function ResultsMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface p-8 text-center" role="status">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <p className="mt-2 text-sm">{body}</p>
    </div>
  );
}

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
  const result = await searchDuffelFlights({
    origin: source,
    destination,
    date: travelDate,
    passengers,
    cabin: seatClass,
    maxPrice,
  });

  if (!result.ok) {
    return <ResultsMessage title={result.title} body={result.message} />;
  }

  if (!result.flights.length) {
    return (
      <ResultsMessage
        title="No flights found"
        body="No offers matched this route, date, or price. Try another city or a later date."
      />
    );
  }

  return (
    <FlightGridMotion>
      {result.flights.map((flight) => (
        <FlightCard
          key={flight.id}
          flight={flight}
          passengers={passengers}
          href={`/book/offer/${flight.id}?passengers=${passengers}`}
          actionLabel="Book"
        />
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
      <p className="mb-6 text-sm">
        Results come from Duffel test mode. Use any 3-letter airport code.
      </p>

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
            <label htmlFor="maxPrice">Max price</label>
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
