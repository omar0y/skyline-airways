import { notFound, redirect } from "next/navigation";
import { BookingStepper } from "@/components/BookingStepper";
import { PaymentForm } from "@/components/PaymentForm";
import { payBookingAction } from "@/lib/actions/booking";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/db";

export const metadata = { title: "Payment" };

export default async function PayPage({
  params,
}: {
  params: Promise<{ bookingRef: string }>;
}) {
  const user = await requireUser();
  if (!user.customer) redirect("/account");

  const { bookingRef } = await params;
  const booking = await prisma.booking.findUnique({
    where: { bookingRef },
    include: {
      seats: true,
      passengers: true,
      flight: { include: { departure: true, arrival: true } },
      customer: { include: { milesAccount: true } },
    },
  });

  if (!booking || booking.customerId !== user.customer.id) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-10 md:px-6">
      <BookingStepper current={5} />
      <h1 className="mb-2 text-3xl font-bold text-primary">Payment</h1>
      <p className="mb-6 text-sm">
        {booking.flight.flightNo}: {booking.flight.departure.code} →{" "}
        {booking.flight.arrival.code}
      </p>
      <ul className="mb-6 space-y-1 text-sm">
        <li>
          Passengers: {booking.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(", ")}
        </li>
        <li>Seats: {booking.seats.map((s) => s.seatNo).join(", ") || "None"}</li>
        <li>Amount due: {formatMoney(booking.totalPrice)}</li>
      </ul>
      <PaymentForm
        bookingRef={booking.bookingRef}
        totalPrice={booking.totalPrice}
        miles={booking.customer.milesAccount?.flightMiles ?? 0}
        action={payBookingAction}
      />
    </div>
  );
}
