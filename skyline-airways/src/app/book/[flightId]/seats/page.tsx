import { notFound, redirect } from "next/navigation";
import { BookingStepper } from "@/components/BookingStepper";
import { SeatMap } from "@/components/SeatMap";
import { holdSeatsAction } from "@/lib/actions/booking";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "Select seats" };

export default async function SelectSeatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ flightId: string }>;
  searchParams: Promise<{ bookingRef?: string }>;
}) {
  const user = await requireUser();
  if (!user.customer) redirect("/account");

  const { flightId } = await params;
  const { bookingRef } = await searchParams;
  if (!bookingRef) redirect(`/book/${flightId}`);

  const booking = await prisma.booking.findUnique({
    where: { bookingRef },
    include: { passengers: true, flight: true },
  });

  if (!booking || booking.customerId !== user.customer.id) notFound();
  if (booking.flightId !== Number(flightId)) notFound();

  const seats = await prisma.flightSeat.findMany({
    where: { flightId: booking.flightId },
    orderBy: { seatNo: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <BookingStepper current={4} />
      <h1 className="mb-2 text-3xl font-bold text-primary">Choose seats</h1>
      <p className="mb-6 text-sm">
        Booking {booking.bookingRef} · {booking.flight.flightNo}
      </p>
      <SeatMap
        seats={seats}
        bookingRef={booking.bookingRef}
        bookingId={booking.id}
        needed={booking.passengers.length}
        action={holdSeatsAction}
      />
    </div>
  );
}
