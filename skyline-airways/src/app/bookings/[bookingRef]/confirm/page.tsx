import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { BookingStepper } from "@/components/BookingStepper";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/db";

export const metadata = { title: "Confirmation" };

export default async function ConfirmPage({
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
      tickets: { include: { passenger: true } },
      payment: true,
      seats: true,
      flight: { include: { departure: true, arrival: true } },
    },
  });

  if (!booking || booking.customerId !== user.customer.id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <BookingStepper current={6} />
      <div className="surface p-8 text-center">
        <CheckCircle size={48} className="mx-auto text-primary" weight="fill" aria-hidden="true" />
        <h1 className="mt-4 text-3xl font-bold text-primary">Booking confirmed</h1>
        <p className="mt-2 text-sm">Reference {booking.bookingRef}</p>
      </div>

      <div className="surface mt-6 space-y-3 p-6 text-sm">
        <p>
          <span className="font-bold text-primary">Flight:</span> {booking.flight.flightNo} ·{" "}
          {booking.flight.departure.code} → {booking.flight.arrival.code}
        </p>
        <p>
          <span className="font-bold text-primary">Departure:</span>{" "}
          {formatDateTime(booking.flight.departureTime)}
        </p>
        <p>
          <span className="font-bold text-primary">Paid:</span>{" "}
          {formatMoney(booking.payment?.amount ?? booking.totalPrice)} via{" "}
          {booking.payment?.method ?? "N/A"} ({booking.payment?.transactionRef})
        </p>
        <p>
          <span className="font-bold text-primary">Seats:</span>{" "}
          {booking.seats.map((s) => s.seatNo).join(", ")}
        </p>
        <div>
          <p className="mb-2 font-bold text-primary">Tickets</p>
          <ul className="space-y-1">
            {booking.tickets.map((t) => (
              <li key={t.id}>
                {t.ticketNo} — {t.passenger.firstName} {t.passenger.lastName} ({t.status})
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/check-in" className="btn btn-primary">
          Go to check-in
        </Link>
        <Link href="/account/bookings" className="btn btn-ghost">
          My bookings
        </Link>
      </div>
    </div>
  );
}
