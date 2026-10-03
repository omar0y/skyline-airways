import { redirect } from "next/navigation";
import { CheckInForm } from "@/components/CheckInForm";
import { checkInAction } from "@/lib/actions/checkin";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Check-in" };

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingRef?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!user.customer) redirect("/account");

  const { bookingRef } = await searchParams;

  const recent = await prisma.booking.findMany({
    where: { customerId: user.customer.id, status: "TICKETED" },
    include: {
      flight: { include: { departure: true, arrival: true } },
      tickets: { include: { checkIn: true, passenger: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="mb-2 text-3xl font-bold text-primary">Online check-in</h1>
      <p className="mb-8 text-sm">
        Enter your booking reference and passenger last name to receive a boarding gate.
      </p>
      <CheckInForm action={checkInAction} defaultRef={bookingRef} />

      {recent.length ? (
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-primary">Your ticketed trips</h2>
          <ul className="space-y-3">
            {recent.map((b) => (
              <li key={b.id} className="surface p-4 text-sm">
                <p className="font-bold text-foreground">{b.bookingRef}</p>
                <p>
                  {b.flight.flightNo}: {b.flight.departure.code} → {b.flight.arrival.code}
                </p>
                <p>{formatDateTime(b.flight.departureTime)}</p>
                <p className="mt-1 text-muted-foreground">
                  {b.tickets.filter((t) => t.checkIn).length}/{b.tickets.length} checked in
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
