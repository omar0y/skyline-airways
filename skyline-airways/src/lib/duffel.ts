import { Duffel, DuffelError } from "@duffel/api";

type CabinClass = "economy" | "premium_economy" | "business" | "first";
type DuffelOffer = Omit<Awaited<ReturnType<Duffel["offers"]["get"]>>["data"], "available_services">;
type OfferSegment = DuffelOffer["slices"][number]["segments"][number];

export type DuffelFlightCard = {
  id: string;
  flightNo: string;
  departureTime: string;
  arrivalTime: string;
  basePrice: number;
  currency: string;
  status: string;
  miles: number;
  detail: string;
  departure: { code: string; city: string };
  arrival: { code: string; city: string };
};

export type DuffelSearchResult =
  | { ok: true; flights: DuffelFlightCard[] }
  | { ok: false; title: string; message: string };

let client: Duffel | null = null;

export function getDuffel() {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Duffel is not configured.");
  }
  if (!client) client = new Duffel({ token });
  return client;
}

export function duffelErrorMessage(error: unknown) {
  if (error instanceof DuffelError) {
    const message = error.errors
      ?.map((item) => item.message || item.title)
      .filter(Boolean)
      .join(" ");
    if (message) return message;
  }
  return "Flight search is temporarily unavailable. Try again in a moment.";
}

function cabinClass(value?: string): CabinClass | undefined {
  const key = value?.trim().toLowerCase();
  if (key === "economy" || key === "business" || key === "first" || key === "premium_economy") {
    return key;
  }
  return undefined;
}

function airportCode(segmentPlace: { iata_code: string | null; iata_city_code?: string | null }) {
  return (segmentPlace.iata_code || segmentPlace.iata_city_code || "").toUpperCase();
}

function milesFromSegments(segments: OfferSegment[]) {
  const km = segments.reduce((sum, segment) => sum + Number(segment.distance || 0), 0);
  return Math.round(km * 0.621371);
}

export function offerToCard(offer: DuffelOffer, passengers: number): DuffelFlightCard | null {
  const slice = offer.slices[0];
  const segments = slice?.segments ?? [];
  const first = segments[0];
  const last = segments[segments.length - 1];
  if (!first || !last) return null;

  const fromCode = airportCode(first.origin);
  const toCode = airportCode(last.destination);
  if (!fromCode || !toCode) return null;

  const stops = Math.max(0, segments.length - 1);
  const carrier = first.marketing_carrier.iata_code || offer.owner.iata_code || "ZZ";
  const perAdult = Number(offer.total_amount) / Math.max(1, passengers);

  return {
    id: offer.id,
    flightNo: `${carrier}${first.marketing_carrier_flight_number}`,
    departureTime: first.departing_at,
    arrivalTime: last.arriving_at,
    basePrice: perAdult,
    currency: offer.total_currency,
    status: stops === 0 ? "DIRECT" : `${stops} STOP`,
    miles: milesFromSegments(segments),
    detail: `${offer.owner.name} · ${stops === 0 ? "Direct" : `${stops} stop${stops > 1 ? "s" : ""}`}`,
    departure: { code: fromCode, city: first.origin.city_name || fromCode },
    arrival: { code: toCode, city: last.destination.city_name || toCode },
  };
}

export async function searchDuffelFlights(input: {
  origin?: string;
  destination?: string;
  date?: string;
  passengers: number;
  cabin?: string;
  maxPrice?: string;
}): Promise<DuffelSearchResult> {
  const origin = input.origin?.trim().toUpperCase() ?? "";
  const destination = input.destination?.trim().toUpperCase() ?? "";
  const date = input.date?.trim() ?? "";

  if (!origin || !destination || !date) {
    return {
      ok: false,
      title: "Search flights",
      message: "Enter an origin, destination, and travel date.",
    };
  }

  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    return {
      ok: false,
      title: "Check the airports",
      message: "Use 3-letter IATA codes, such as LHR and JFK.",
    };
  }

  if (origin === destination) {
    return {
      ok: false,
      title: "Check the route",
      message: "Origin and destination must be different airports.",
    };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {
      ok: false,
      title: "Check the date",
      message: "Choose a travel date.",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(`${date}T12:00:00`) < today) {
    return {
      ok: false,
      title: "Check the date",
      message: "Choose today or a future travel date.",
    };
  }

  const passengers = Math.min(9, Math.max(1, input.passengers));
  const cabin = cabinClass(input.cabin);

  try {
    const response = await getDuffel().offerRequests.create({
      slices: [
        {
          origin,
          destination,
          departure_date: date,
          departure_time: null,
          arrival_time: null,
        },
      ],
      passengers: Array.from({ length: passengers }, () => ({ type: "adult" as const })),
      return_offers: true,
      supplier_timeout: 20000,
      ...(cabin ? { cabin_class: cabin } : {}),
    });
    const maxPrice = input.maxPrice ? Number(input.maxPrice) : NaN;

    const flights = (response.data.offers ?? [])
      .filter((offer) => !offer.partial)
      .map((offer) => offerToCard(offer, passengers))
      .filter((flight): flight is DuffelFlightCard => flight !== null)
      .filter((flight) => (Number.isFinite(maxPrice) ? flight.basePrice <= maxPrice : true))
      .sort((a, b) => a.basePrice - b.basePrice)
      .slice(0, 15);

    return { ok: true, flights };
  } catch (error) {
    return {
      ok: false,
      title: "Could not search flights",
      message: duffelErrorMessage(error),
    };
  }
}

export function clockTime(iso: string) {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!match) return new Date(iso);
  return new Date(`${match[1]}T${match[2]}:00`);
}
