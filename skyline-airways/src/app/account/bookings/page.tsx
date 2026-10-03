import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelBookingAction } from "@/lib/actions/booking";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/db";

export const metadata = { title: "My bookings" };

export default async function AccountBookingsPage() {
  const user = await requireUser();
  if (!user.customer) redirect("/account");

  const bookings = await prisma.booking.findMany({
    where: { customerId: user.customer.id },
    include: {
      flight: { include: { departure: true, arrival: true } },
      tickets: { include: { checkIn: true } },
      seats: true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <h1 className="mb-6 text-3xl font-bold text-primary">My bookings</h1>
      {!bookings.length ? (
        <div className="surface p-8 text-center">
          <p>No bookings yet.</p>
          <Link href="/flights" className="btn btn-primary mt-4 inline-flex">
            Search flights
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => (
            <li key={b.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-primary">{b.bookingRef}</p>
                  <p className="text-sm">
                    {b.flight.flightNo}: {b.flight.departure.code} → {b.flight.arrival.code}
                  </p>
                  <p className="text-sm">{formatDateTime(b.flight.departureTime)}</p>
                  <p className="text-sm">
                    Status: {b.status} · {formatMoney(b.totalPrice, b.payment?.currency)}
                  </p>
                  <p className="text-sm">
                    Seats: {b.seats.map((s) => s.seatNo).join(", ") || "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.status === "TICKETED" ? (
                    <Link
                      href={`/check-in?bookingRef=${b.bookingRef}`}
                      className="btn btn-secondary !min-h-10 !px-3 text-sm"
                    >
                      Check in
                    </Link>
                  ) : null}
                  {b.status === "RESERVED" ? (
                    <Link
                      href={`/book/${b.flightId}/seats?bookingRef=${b.bookingRef}`}
                      className="btn btn-primary !min-h-10 !px-3 text-sm"
                    >
                      Continue
                    </Link>
                  ) : null}
                  {b.status !== "CANCELLED" && b.status !== "TICKETED" ? (
                    <form action={cancelBookingAction}>
                      <input type="hidden" name="bookingRef" value={b.bookingRef} />
                      <button type="submit" className="btn btn-ghost !min-h-10 !px-3 text-sm">
                        Cancel
                      </button>
                    </form>
                  ) : null}
                  {b.status === "TICKETED" ? (
                    <form action={cancelBookingAction}>
                      <input type="hidden" name="bookingRef" value={b.bookingRef} />
                      <button type="submit" className="btn btn-ghost !min-h-10 !px-3 text-sm">
                        Cancel & refund
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
