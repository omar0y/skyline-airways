import { modifyBookingAction } from "@/lib/actions/admin";
import { boardPassengerAction } from "@/lib/actions/checkin";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/db";

export const metadata = { title: "Admin bookings" };

export default async function AdminBookingsPage() {
  await requireAdmin();

  const bookings = await prisma.booking.findMany({
    include: {
      customer: true,
      flight: { include: { departure: true, arrival: true } },
      payment: true,
      tickets: { include: { passenger: true, checkIn: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="mb-6 text-3xl font-bold text-primary">Bookings</h1>
      <ul className="space-y-4">
        {bookings.map((b) => (
          <li key={b.id} className="surface p-5 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-primary">{b.bookingRef}</p>
                <p>
                  {b.customer.firstName} {b.customer.lastName} · {b.status}
                </p>
                <p>
                  {b.flight.flightNo}: {b.flight.departure.code} → {b.flight.arrival.code}
                </p>
                <p>
                  {formatDateTime(b.createdAt)} · {formatMoney(b.totalPrice)}
                  {b.payment ? ` · ${b.payment.status}` : ""}
                </p>
              </div>
              <form action={modifyBookingAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="bookingRef" value={b.bookingRef} />
                <div className="field">
                  <label htmlFor={`status-${b.id}`}>Status</label>
                  <select id={`status-${b.id}`} name="status" defaultValue={b.status}>
                    <option value="RESERVED">RESERVED</option>
                    <option value="PAID">PAID</option>
                    <option value="TICKETED">TICKETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-secondary !min-h-10">
                  Update
                </button>
              </form>
            </div>
            {b.tickets.length ? (
              <ul className="mt-4 space-y-2 border-t border-border pt-3">
                {b.tickets.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {t.ticketNo} · {t.passenger.firstName} {t.passenger.lastName} · {t.status}
                      {t.checkIn ? ` · Gate ${t.checkIn.boardingGate}` : ""}
                    </span>
                    {t.checkIn && t.checkIn.status === "CHECKED_IN" ? (
                      <form action={boardPassengerAction}>
                        <input type="hidden" name="ticketId" value={t.id} />
                        <button type="submit" className="btn btn-ghost !min-h-9 !px-3 text-xs">
                          Mark boarded
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
