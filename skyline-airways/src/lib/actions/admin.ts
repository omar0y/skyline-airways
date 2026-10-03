"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function seatLayout(capacity: number) {
  const seats: { seatNo: string; seatClass: string; price: number }[] = [];
  const letters = ["A", "B", "C", "D", "E", "F"];
  let n = 0;
  let row = 1;
  while (n < capacity) {
    for (const letter of letters) {
      if (n >= capacity) break;
      const seatClass = row <= 2 ? "FIRST" : row <= 6 ? "BUSINESS" : "ECONOMY";
      const price =
        seatClass === "FIRST" ? 220 : seatClass === "BUSINESS" ? 120 : 0;
      seats.push({ seatNo: `${row}${letter}`, seatClass, price });
      n++;
    }
    row++;
  }
  return seats;
}

export async function addFlightAction(formData: FormData) {
  await requireAdmin();

  const flightNo = str(formData, "flightNo");
  const aircraftId = Number(str(formData, "aircraftId"));
  const departureId = Number(str(formData, "departureId"));
  const arrivalId = Number(str(formData, "arrivalId"));
  const departureTime = new Date(str(formData, "departureTime"));
  const arrivalTime = new Date(str(formData, "arrivalTime"));
  const basePrice = Number(str(formData, "basePrice"));
  const miles = Number(str(formData, "miles") || "0");

  const aircraft = await prisma.aircraft.findUnique({ where: { id: aircraftId } });
  if (!aircraft) return;

  const flight = await prisma.flight.create({
    data: {
      flightNo,
      aircraftId,
      departureId,
      arrivalId,
      departureTime,
      arrivalTime,
      basePrice,
      miles,
      status: "SCHEDULED",
    },
  });

  await prisma.flightSeat.createMany({
    data: seatLayout(aircraft.capacity).map((s) => ({
      ...s,
      aircraftId,
      flightId: flight.id,
      status: "AVAILABLE",
    })),
  });

  revalidatePath("/admin/flights");
  revalidatePath("/flights");
}

export async function delayFlightAction(formData: FormData) {
  await requireAdmin();
  const id = Number(str(formData, "flightId"));
  const minutes = Number(str(formData, "minutes") || "30");

  const flight = await prisma.flight.findUnique({ where: { id } });
  if (!flight) return;

  await prisma.flight.update({
    where: { id },
    data: {
      status: "DELAYED",
      departureTime: new Date(flight.departureTime.getTime() + minutes * 60000),
      arrivalTime: new Date(flight.arrivalTime.getTime() + minutes * 60000),
    },
  });

  revalidatePath("/admin/flights");
}

export async function closeFlightAction(formData: FormData) {
  await requireAdmin();
  const id = Number(str(formData, "flightId"));
  await prisma.flight.update({
    where: { id },
    data: { status: "CLOSED" },
  });
  revalidatePath("/admin/flights");
}

export async function removeUserAction(formData: FormData) {
  await requireAdmin();
  const userId = Number(str(formData, "userId"));
  const admin = await requireAdmin();
  if (userId === admin.id) return;

  await prisma.user.update({
    where: { id: userId },
    data: { status: "DISABLED" },
  });
  await prisma.session.deleteMany({ where: { userId } });
  revalidatePath("/admin/users");
}

export async function modifyBookingAction(formData: FormData) {
  await requireAdmin();
  const bookingRef = str(formData, "bookingRef");
  const status = str(formData, "status");

  const booking = await prisma.booking.findUnique({
    where: { bookingRef },
    include: { payment: true },
  });
  if (!booking) return;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { status },
    });

    if (status === "CANCELLED") {
      await tx.flightSeat.updateMany({
        where: { bookingId: booking.id },
        data: { status: "AVAILABLE", bookingId: null },
      });
      await tx.ticket.updateMany({
        where: { bookingId: booking.id },
        data: { status: "CANCELLED" },
      });
      if (booking.payment?.status === "AUTHORIZED") {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: "REFUNDED" },
        });
      }
    }
  });

  revalidatePath("/admin/bookings");
}
