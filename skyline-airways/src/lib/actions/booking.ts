"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  bookingRef,
  requireUser,
  ticketNo,
  transactionRef,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export type BookingActionState = {
  ok: boolean;
  errors?: string[];
};

export async function createBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const user = await requireUser();
  if (!user.customer) {
    return { ok: false, errors: ["Only customers can create bookings."] };
  }

  const flightId = Number(str(formData, "flightId"));
  const count = Number(str(formData, "passengers") || "1");

  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (!flight || flight.status === "CLOSED" || flight.status === "CANCELLED") {
    return { ok: false, errors: ["Flight is not available for booking."] };
  }

  const passengers = [];
  for (let i = 0; i < count; i++) {
    const firstName = str(formData, `firstName_${i}`);
    const lastName = str(formData, `lastName_${i}`);
    const dateOfBirth = str(formData, `dateOfBirth_${i}`);
    const nationality = str(formData, `nationality_${i}`);
    if (!firstName || !lastName || !dateOfBirth || !nationality) {
      return {
        ok: false,
        errors: [`Complete all fields for passenger ${i + 1}.`],
      };
    }
    passengers.push({
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      nationality,
    });
  }

  const booking = await prisma.booking.create({
    data: {
      bookingRef: bookingRef(),
      status: "RESERVED",
      totalPrice: flight.basePrice * passengers.length,
      customerId: user.customer.id,
      flightId: flight.id,
      passengers: { create: passengers },
    },
  });

  redirect(`/book/${flight.id}/seats?bookingRef=${booking.bookingRef}`);
}

export async function holdSeatsAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const user = await requireUser();
  if (!user.customer) {
    return { ok: false, errors: ["Sign in as a customer to select seats."] };
  }

  const bookingRefValue = str(formData, "bookingRef");
  const seatIds = formData
    .getAll("seatId")
    .map((v) => Number(v))
    .filter(Boolean);

  const booking = await prisma.booking.findUnique({
    where: { bookingRef: bookingRefValue },
    include: { passengers: true, seats: true },
  });

  if (!booking || booking.customerId !== user.customer.id) {
    return { ok: false, errors: ["Booking not found."] };
  }

  if (booking.status === "CANCELLED") {
    return { ok: false, errors: ["Booking was cancelled."] };
  }

  if (seatIds.length !== booking.passengers.length) {
    return {
      ok: false,
      errors: [`Select exactly ${booking.passengers.length} seat(s).`],
    };
  }

  const seats = await prisma.flightSeat.findMany({
    where: {
      id: { in: seatIds },
      flightId: booking.flightId,
    },
  });

  if (seats.length !== seatIds.length) {
    return { ok: false, errors: ["One or more seats are invalid."] };
  }

  const blocked = seats.some(
    (s) =>
      s.status === "SOLD" ||
      (s.status === "HELD" && s.bookingId !== booking.id),
  );
  if (blocked) {
    return { ok: false, errors: ["A selected seat is no longer available."] };
  }

  await prisma.$transaction(async (tx) => {
    if (booking.seats.length) {
      await tx.flightSeat.updateMany({
        where: { bookingId: booking.id },
        data: { status: "AVAILABLE", bookingId: null },
      });
    }

    let seatExtra = 0;
    for (const seat of seats) {
      seatExtra += seat.price;
      await tx.flightSeat.update({
        where: { id: seat.id },
        data: { status: "HELD", bookingId: booking.id },
      });
    }

    const flight = await tx.flight.findUniqueOrThrow({
      where: { id: booking.flightId },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        totalPrice: flight.basePrice * booking.passengers.length + seatExtra,
      },
    });
  });

  redirect(`/bookings/${booking.bookingRef}/pay`);
}

export async function payBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const user = await requireUser();
  if (!user.customer) {
    return { ok: false, errors: ["Sign in as a customer to pay."] };
  }

  const bookingRefValue = str(formData, "bookingRef");
  const method = str(formData, "method") || "CARD";
  const useMiles = str(formData, "useMiles") === "on";

  const booking = await prisma.booking.findUnique({
    where: { bookingRef: bookingRefValue },
    include: {
      passengers: true,
      seats: true,
      flight: true,
      payment: true,
      customer: { include: { milesAccount: true } },
    },
  });

  if (!booking || booking.customerId !== user.customer.id) {
    return { ok: false, errors: ["Booking not found."] };
  }

  if (!booking.seats.length || booking.seats.length !== booking.passengers.length) {
    return { ok: false, errors: ["Select seats before payment."] };
  }

  if (booking.status === "TICKETED" || booking.status === "PAID") {
    redirect(`/bookings/${booking.bookingRef}/confirm`);
  }

  let amount = booking.totalPrice;
  const milesAccount = booking.customer.milesAccount;

  await prisma.$transaction(async (tx) => {
    if (useMiles && milesAccount && milesAccount.flightMiles > 0) {
      const redeem = Math.min(milesAccount.flightMiles, Math.floor(amount * 10));
      const discount = redeem / 10;
      amount = Math.max(0, amount - discount);
      await tx.milesAccount.update({
        where: { id: milesAccount.id },
        data: {
          flightMiles: { decrement: redeem },
          statusMiles: { decrement: Math.min(milesAccount.statusMiles, redeem) },
        },
      });
    }

    const txn = transactionRef();
    if (booking.payment) {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: {
          amount,
          method,
          status: "AUTHORIZED",
          paidAt: new Date(),
          transactionRef: txn,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount,
          method,
          status: "AUTHORIZED",
          paidAt: new Date(),
          transactionRef: txn,
        },
      });
    }

    await tx.flightSeat.updateMany({
      where: { bookingId: booking.id },
      data: { status: "SOLD" },
    });

    for (const passenger of booking.passengers) {
      const existing = await tx.ticket.findUnique({
        where: { passengerId: passenger.id },
      });
      if (!existing) {
        await tx.ticket.create({
          data: {
            ticketNo: ticketNo(),
            status: "ISSUED",
            bookingId: booking.id,
            passengerId: passenger.id,
            flightId: booking.flightId,
          },
        });
      }
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "TICKETED", totalPrice: amount },
    });

    if (milesAccount) {
      await tx.milesAccount.update({
        where: { id: milesAccount.id },
        data: {
          flightMiles: { increment: booking.flight.miles * booking.passengers.length },
          statusMiles: { increment: booking.flight.miles * booking.passengers.length },
        },
      });
    }
  });

  revalidatePath("/account");
  redirect(`/bookings/${booking.bookingRef}/confirm`);
}

export async function cancelBookingAction(formData: FormData) {
  const user = await requireUser();
  if (!user.customer && user.role !== "ADMIN") return;

  const bookingRefValue = str(formData, "bookingRef");
  const booking = await prisma.booking.findUnique({
    where: { bookingRef: bookingRefValue },
    include: { payment: true, tickets: true },
  });

  if (!booking) return;
  if (user.customer && booking.customerId !== user.customer.id && user.role !== "ADMIN") {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.flightSeat.updateMany({
      where: { bookingId: booking.id },
      data: { status: "AVAILABLE", bookingId: null },
    });
    await tx.ticket.updateMany({
      where: { bookingId: booking.id },
      data: { status: "CANCELLED" },
    });
    if (booking.payment && booking.payment.status === "AUTHORIZED") {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: "REFUNDED" },
      });
    }
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
    });
  });

  revalidatePath("/account/bookings");
  revalidatePath("/admin/bookings");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  if (!user.customer) return;

  await prisma.customerProfile.update({
    where: { id: user.customer.id },
    data: {
      firstName: str(formData, "firstName"),
      middleName: str(formData, "middleName") || null,
      lastName: str(formData, "lastName"),
      phone: str(formData, "phone") || null,
      salutation: str(formData, "salutation") || null,
    },
  });

  revalidatePath("/account");
}
