"use server";

import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { bookingRef, requireUser, ticketNo } from "@/lib/auth";
import { clockTime, duffelErrorMessage, getDuffel } from "@/lib/duffel";
import { prisma } from "@/lib/db";
import { Duffel } from "@duffel/api";

type DuffelOffer = Omit<Awaited<ReturnType<Duffel["offers"]["get"]>>["data"], "available_services">;
type DuffelAirport = DuffelOffer["slices"][number]["segments"][number]["origin"];
type PassengerTitle = "mr" | "ms" | "mrs" | "miss" | "dr";
type PassengerGender = "m" | "f";

export type DuffelBookingState = {
  ok: boolean;
  errors?: string[];
};

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

const TITLES = new Set<PassengerTitle>(["mr", "ms", "mrs", "miss", "dr"]);
const GENDERS = new Set<PassengerGender>(["m", "f"]);

function ageOn(bornOn: string, on: Date) {
  const born = new Date(`${bornOn}T12:00:00`);
  let age = on.getFullYear() - born.getFullYear();
  const month = on.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && on.getDate() < born.getDate())) age -= 1;
  return age;
}

async function upsertAirport(tx: Prisma.TransactionClient, place: DuffelAirport) {
  const code = (place.iata_code || place.iata_city_code || "").toUpperCase();
  return tx.airport.upsert({
    where: { code },
    update: {
      name: place.name,
      city: place.city_name || code,
      country: place.iata_country_code || "—",
    },
    create: {
      code,
      name: place.name,
      city: place.city_name || code,
      country: place.iata_country_code || "—",
      terminal: null,
    },
  });
}

export async function bookDuffelOfferAction(
  _prev: DuffelBookingState,
  formData: FormData,
): Promise<DuffelBookingState> {
  const user = await requireUser();
  const customer = user.customer;
  if (!customer) {
    return { ok: false, errors: ["Only customers can book flights."] };
  }

  const offerId = str(formData, "offerId");
  if (!/^off_[A-Za-z0-9]+$/.test(offerId)) {
    return { ok: false, errors: ["That flight offer is not valid."] };
  }

  let offer: DuffelOffer;
  try {
    const response = await getDuffel().offers.get(offerId);
    offer = response.data;
  } catch (error) {
    return { ok: false, errors: [duffelErrorMessage(error)] };
  }

  if (offer.expires_at && new Date(offer.expires_at).getTime() < Date.now()) {
    return { ok: false, errors: ["This offer has expired. Search again."] };
  }

  const expected = offer.passengers.length;
  const passengers: {
    id: string;
    title: PassengerTitle;
    gender: PassengerGender;
    firstName: string;
    lastName: string;
    bornOn: string;
    nationality: string;
    email: string;
    phone: string;
  }[] = [];
  for (let i = 0; i < expected; i++) {
    const title = str(formData, `title_${i}`).toLowerCase();
    const gender = str(formData, `gender_${i}`).toLowerCase();
    const firstName = str(formData, `firstName_${i}`);
    const lastName = str(formData, `lastName_${i}`);
    const bornOn = str(formData, `dateOfBirth_${i}`);
    const nationality = str(formData, `nationality_${i}`);
    const email = str(formData, `email_${i}`);
    const phone = str(formData, `phone_${i}`).replace(/\s/g, "");

    if (!TITLES.has(title as PassengerTitle)) {
      return { ok: false, errors: [`Choose a title for passenger ${i + 1}.`] };
    }
    if (!GENDERS.has(gender as PassengerGender)) {
      return { ok: false, errors: [`Choose a gender for passenger ${i + 1}.`] };
    }
    if (!/^[A-Za-z][A-Za-z '\-]{0,19}$/.test(firstName) || !/^[A-Za-z][A-Za-z '\-]{0,19}$/.test(lastName)) {
      return {
        ok: false,
        errors: [`Passenger ${i + 1} names can use letters, spaces, hyphens, and apostrophes only.`],
      };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bornOn) || ageOn(bornOn, new Date()) < 18) {
      return { ok: false, errors: [`Passenger ${i + 1} must be an adult aged 18 or over.`] };
    }
    if (nationality.length < 2) {
      return { ok: false, errors: [`Enter a nationality for passenger ${i + 1}.`] };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, errors: [`Enter a valid email for passenger ${i + 1}.`] };
    }
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      return {
        ok: false,
        errors: [`Passenger ${i + 1} phone must be in international format, like +442080160509.`],
      };
    }

    const offerPassenger = offer.passengers[i];
    if (!offerPassenger) {
      return { ok: false, errors: ["This offer does not match the passenger count."] };
    }

    passengers.push({
      id: offerPassenger.id,
      title: title as PassengerTitle,
      gender: gender as PassengerGender,
      firstName,
      lastName,
      bornOn,
      nationality,
      email,
      phone,
    });
  }

  let order;
  try {
    const created = await getDuffel().orders.create({
      type: "instant",
      selected_offers: [offer.id],
      payments: [
        {
          type: "balance",
          currency: offer.total_currency,
          amount: offer.total_amount,
        },
      ],
      passengers: passengers.map((passenger) => ({
        id: passenger.id,
        title: passenger.title,
        gender: passenger.gender,
        given_name: passenger.firstName,
        family_name: passenger.lastName,
        born_on: passenger.bornOn,
        email: passenger.email,
        phone_number: passenger.phone,
      })),
    });
    order = created.data;
  } catch (error) {
    return { ok: false, errors: [duffelErrorMessage(error)] };
  }

  const slice = order.slices[0];
  const segments = slice?.segments ?? [];
  const first = segments[0];
  const last = segments[segments.length - 1];
  if (!first || !last) {
    return {
      ok: false,
      errors: [
        `Duffel confirmed order ${order.booking_reference}, but the itinerary could not be saved. Contact support with that reference.`,
      ],
    };
  }

  const existing = await prisma.booking.findUnique({
    where: { duffelOrderId: order.id },
  });
  if (existing) redirect(`/bookings/${existing.bookingRef}/confirm`);

  const preferredRef = order.booking_reference?.toUpperCase();
  const refTaken = preferredRef
    ? await prisma.booking.findUnique({ where: { bookingRef: preferredRef } })
    : null;
  const ref = preferredRef && !refTaken ? preferredRef : bookingRef();

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const departure = await upsertAirport(tx, first.origin);
      const arrival = await upsertAirport(tx, last.destination);
      const model = first.aircraft?.name || "Duffel aircraft";
      const aircraft =
        (await tx.aircraft.findFirst({ where: { model } })) ??
        (await tx.aircraft.create({ data: { model, capacity: 180 } }));

      const offerSegments = offer.slices[0]?.segments ?? [];
      const km = offerSegments.reduce((sum, segment) => sum + Number(segment.distance || 0), 0);
      const flight = await tx.flight.create({
        data: {
          flightNo: `${first.marketing_carrier.iata_code || "ZZ"}${first.marketing_carrier_flight_number}`,
          departureTime: clockTime(first.departing_at),
          arrivalTime: clockTime(last.arriving_at),
          status: "SCHEDULED",
          basePrice: Number(order.total_amount) / passengers.length,
          miles: Math.round(km * 0.621371),
          aircraftId: aircraft.id,
          departureId: departure.id,
          arrivalId: arrival.id,
          duffelOfferId: offer.id,
        },
      });

      const createdBooking = await tx.booking.create({
        data: {
          bookingRef: ref,
          status: "TICKETED",
          totalPrice: Number(order.total_amount),
          customerId: customer.id,
          flightId: flight.id,
          duffelOrderId: order.id,
          passengers: {
            create: passengers.map((passenger) => ({
              firstName: passenger.firstName,
              lastName: passenger.lastName,
              dateOfBirth: new Date(`${passenger.bornOn}T12:00:00`),
              nationality: passenger.nationality,
            })),
          },
          payment: {
            create: {
              amount: Number(order.total_amount),
              method: "DUFFEL_BALANCE",
              status: "AUTHORIZED",
              currency: order.total_currency,
              paidAt: new Date(),
              transactionRef: order.id,
            },
          },
        },
        include: { passengers: true },
      });

      for (const passenger of createdBooking.passengers) {
        await tx.ticket.create({
          data: {
            ticketNo: ticketNo(),
            status: "ISSUED",
            bookingId: createdBooking.id,
            passengerId: passenger.id,
            flightId: flight.id,
          },
        });
      }

      if (customer.milesAccount && flight.miles > 0) {
        await tx.milesAccount.update({
          where: { id: customer.milesAccount.id },
          data: {
            flightMiles: { increment: flight.miles * passengers.length },
            statusMiles: { increment: flight.miles * passengers.length },
          },
        });
      }

      return createdBooking;
    });

    redirect(`/bookings/${booking.bookingRef}/confirm`);
  } catch (error) {
    const digest = error && typeof error === "object" && "digest" in error ? String(error.digest) : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw error;
    return {
      ok: false,
      errors: [
        `Duffel confirmed booking ${order.booking_reference}, but saving it locally failed. Keep that reference.`,
      ],
    };
  }
}
