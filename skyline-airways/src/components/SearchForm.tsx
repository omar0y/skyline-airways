"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

type AirportOption = { code: string; city: string; name: string };

const EXTRA_AIRPORTS: AirportOption[] = [
  { code: "LAX", city: "Los Angeles", name: "Los Angeles International" },
  { code: "SFO", city: "San Francisco", name: "San Francisco International" },
  { code: "ATL", city: "Atlanta", name: "Hartsfield-Jackson" },
  { code: "ORD", city: "Chicago", name: "O'Hare" },
  { code: "MAD", city: "Madrid", name: "Madrid-Barajas" },
  { code: "FCO", city: "Rome", name: "Fiumicino" },
  { code: "AMS", city: "Amsterdam", name: "Schiphol" },
  { code: "FRA", city: "Frankfurt", name: "Frankfurt" },
  { code: "DOH", city: "Doha", name: "Hamad" },
  { code: "SIN", city: "Singapore", name: "Changi" },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi" },
  { code: "JED", city: "Jeddah", name: "King Abdulaziz" },
];

function AirportField({
  id,
  name,
  label,
  placeholder,
  options,
  defaultValue = "",
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  options: AirportOption[];
  defaultValue?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase();
    const filtered = options.filter((airport) => {
      if (!query) return true;
      return (
        airport.code.toLowerCase().includes(query) ||
        airport.city.toLowerCase().includes(query) ||
        airport.name.toLowerCase().includes(query)
      );
    });
    return filtered.slice(0, 8);
  }, [options, value]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className={`field relative ${open ? "z-30" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        autoCapitalize="characters"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        required
        pattern="[A-Za-z]{3}"
        title="Choose an airport or enter its 3-letter code"
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && matches.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-30 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-card py-1"
        >
          {matches.map((airport) => (
            <li key={airport.code} role="presentation">
              <button
                type="button"
                role="option"
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setValue(airport.code);
                  setOpen(false);
                }}
              >
                <span>
                  <span className="font-bold">{airport.city}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{airport.name}</span>
                </span>
                <span className="font-bold text-primary">{airport.code}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

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
  const options = [...airports, ...EXTRA_AIRPORTS].filter(
    (airport, index, list) => list.findIndex((item) => item.code === airport.code) === index,
  );

  return (
    <form
      action="/flights"
      method="get"
      className={`grid gap-4 ${compact ? "md:grid-cols-5" : "md:grid-cols-2 lg:grid-cols-5"}`}
    >
      <AirportField
        id="source"
        name="source"
        label="From"
        placeholder="LHR"
        options={options}
        defaultValue={defaults?.source || ""}
      />
      <AirportField
        id="destination"
        name="destination"
        label="To"
        placeholder="JFK"
        options={options}
        defaultValue={defaults?.destination || ""}
      />
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
