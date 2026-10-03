import { requireAdmin } from "@/lib/auth";
import {
  addFlightAction,
  closeFlightAction,
  delayFlightAction,
} from "@/lib/actions/admin";
import { formatDateTime, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/db";

export const metadata = { title: "Admin flights" };

export default async function AdminFlightsPage() {
  await requireAdmin();

  const [flights, airports, aircrafts] = await Promise.all([
    prisma.flight.findMany({
      include: { departure: true, arrival: true, aircraft: true },
      orderBy: { departureTime: "asc" },
      take: 50,
    }),
    prisma.airport.findMany({ orderBy: { code: "asc" } }),
    prisma.aircraft.findMany(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="mb-6 text-3xl font-bold text-primary">Flights</h1>

      <form action={addFlightAction} className="surface mb-10 grid gap-4 p-5 md:grid-cols-2">
        <h2 className="md:col-span-2 font-bold text-primary">Add flight</h2>
        <div className="field">
          <label htmlFor="flightNo">Flight number</label>
          <input id="flightNo" name="flightNo" required placeholder="SL999" />
        </div>
        <div className="field">
          <label htmlFor="basePrice">Base price</label>
          <input id="basePrice" name="basePrice" type="number" min={1} required />
        </div>
        <div className="field">
          <label htmlFor="miles">Miles</label>
          <input id="miles" name="miles" type="number" min={0} defaultValue={500} />
        </div>
        <div className="field">
          <label htmlFor="aircraftId">Aircraft</label>
          <select id="aircraftId" name="aircraftId" required>
            {aircrafts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.model} ({a.capacity})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="departureId">Departure airport</label>
          <select id="departureId" name="departureId" required>
            {airports.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.city}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="arrivalId">Arrival airport</label>
          <select id="arrivalId" name="arrivalId" required>
            {airports.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.city}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="departureTime">Departure</label>
          <input id="departureTime" name="departureTime" type="datetime-local" required />
        </div>
        <div className="field">
          <label htmlFor="arrivalTime">Arrival</label>
          <input id="arrivalTime" name="arrivalTime" type="datetime-local" required />
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="btn btn-primary">
            Add flight
          </button>
        </div>
      </form>

      <ul className="space-y-3">
        {flights.map((f) => (
          <li key={f.id} className="surface flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="text-sm">
              <p className="font-bold text-primary">
                {f.flightNo} · {f.status}
              </p>
              <p>
                {f.departure.code} → {f.arrival.code} · {f.aircraft.model}
              </p>
              <p>
                {formatDateTime(f.departureTime)} · {formatMoney(f.basePrice)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={delayFlightAction} className="flex items-center gap-2">
                <input type="hidden" name="flightId" value={f.id} />
                <input
                  type="number"
                  name="minutes"
                  defaultValue={30}
                  min={5}
                  className="w-20 rounded border border-border px-2 py-2"
                  aria-label="Delay minutes"
                />
                <button type="submit" className="btn btn-ghost !min-h-10 !px-3 text-sm">
                  Delay
                </button>
              </form>
              <form action={closeFlightAction}>
                <input type="hidden" name="flightId" value={f.id} />
                <button type="submit" className="btn btn-ghost !min-h-10 !px-3 text-sm">
                  Close
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
