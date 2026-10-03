"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export type CheckInState = {
  ok: boolean;
  errors?: string[];
  message?: string;
  gate?: string;
};

const GATES = ["A12", "B04", "C21", "D08", "E15"];

export async function checkInAction(
  _prev: CheckInState,
  formData: FormData,
): Promise<CheckInState> {
  const user = await requireUser();
  if (!user.customer) {
    return { ok: false, errors: ["Only customers can check in."] };
  }

  const bookingRef = str(formData, "bookingRef").toUpperCase();
  const lastName = str(formData, "lastName");

  const booking = await prisma.booking.findUnique({
    where: { bookingRef },
    include: {
      tickets: {
        include: {
          passenger: true,
          checkIn: true,
          flight: true,
        },
      },
      seats: true,
      customer: true,
    },
  });

  if (!booking || booking.customerId !== user.customer.id) {
    return { ok: false, errors: ["Booking not found for this account."] };
  }

  if (booking.status !== "TICKETED") {
    return { ok: false, errors: ["Check-in is only available for ticketed bookings."] };
  }

  const matching = booking.tickets.filter(
    (t) => t.passenger.lastName.toLowerCase() === lastName.toLowerCase(),
  );

  if (!matching.length) {
    return { ok: false, errors: ["No passenger with that last name on this booking."] };
  }

  const gate = GATES[booking.id % GATES.length];
  let checked = 0;

  await prisma.$transaction(async (tx) => {
    for (const ticket of matching) {
      if (ticket.checkIn) continue;
      const seat =
        booking.seats[checked] ||
        booking.seats.find((s) => s.status === "SOLD") ||
        booking.seats[0];
      if (!seat) continue;

      const occupied = await tx.checkIn.findUnique({ where: { seatId: seat.id } });
      if (occupied) continue;

      await tx.checkIn.create({
        data: {
          boardingGate: gate,
          status: "CHECKED_IN",
          ticketId: ticket.id,
          seatId: seat.id,
        },
      });
      checked++;
    }
  });

  if (!checked && matching.every((t) => t.checkIn)) {
    return {
      ok: true,
      message: "Already checked in.",
      gate: matching[0]?.checkIn?.boardingGate || gate,
    };
  }

  revalidatePath("/check-in");
  revalidatePath("/account/bookings");

  return {
    ok: true,
    message: `Checked in ${checked || matching.length} passenger(s).`,
    gate,
  };
}

export async function boardPassengerAction(formData: FormData) {
  await requireUser();
  const ticketId = Number(str(formData, "ticketId"));
  const checkIn = await prisma.checkIn.findUnique({ where: { ticketId } });
  if (!checkIn) return;

  await prisma.$transaction([
    prisma.checkIn.update({
      where: { id: checkIn.id },
      data: { status: "BOARDED" },
    }),
    prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "BOARDED" },
    }),
  ]);

  revalidatePath("/admin/bookings");
  revalidatePath("/account/bookings");
}
