import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

type AirportOption = { code: string; city: string; name: string };

export function SearchForm({
  airports,
  defaults,
  compact = false,
}: {
  airports: AirportOption[];
  defaults?: {
    source?: string;
    destination?: string;
    travelDate?: string;
    passengers?: string;
  };
  compact?: boolean;
}) {
  return (
    <form
      action="/flights"
      method="get"
      className={`grid gap-4 ${compact ? "md:grid-cols-5" : "md:grid-cols-2 lg:grid-cols-5"}`}
    >
      <div className="field">
        <label htmlFor="source">From</label>
        <select id="source" name="source" defaultValue={defaults?.source || ""} required>
          <option value="" disabled>
            Select airport
          </option>
          {airports.map((a) => (
            <option key={a.code} value={a.code}>
              {a.city} ({a.code})
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="destination">To</label>
        <select
          id="destination"
          name="destination"
          defaultValue={defaults?.destination || ""}
          required
        >
          <option value="" disabled>
            Select airport
          </option>
          {airports.map((a) => (
            <option key={a.code} value={a.code}>
              {a.city} ({a.code})
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="travelDate">Travel date</label>
        <input
          id="travelDate"
          name="travelDate"
          type="date"
          defaultValue={defaults?.travelDate || ""}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="passengers">Passengers</label>
        <input
          id="passengers"
          name="passengers"
          type="number"
          min={1}
          max={9}
          defaultValue={defaults?.passengers || "1"}
          required
        />
      </div>
      <div className={`flex items-end ${compact ? "" : "md:col-span-2 lg:col-span-1"}`}>
        <button type="submit" className="btn btn-primary w-full">
          <MagnifyingGlass size={18} aria-hidden="true" />
          Search flights
        </button>
      </div>
    </form>
  );
}
