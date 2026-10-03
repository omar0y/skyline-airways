import { notFound, redirect } from "next/navigation";
import { BookingStepper } from "@/components/BookingStepper";
import { PassengerForm } from "@/components/PassengerForm";
import { createBookingAction } from "@/lib/actions/booking";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "Passengers" };

export default async function BookPassengersPage({
  params,
  searchParams,
}: {
  params: Promise<{ flightId: string }>;
  searchParams: Promise<{ passengers?: string }>;
}) {
  const user = await requireUser();
  if (!user.customer) redirect("/account");

  const { flightId } = await params;
  const { passengers: p } = await searchParams;
  const passengers = Math.min(9, Math.max(1, Number(p || 1)));

  const flight = await prisma.flight.findUnique({
    where: { id: Number(flightId) },
    include: { departure: true, arrival: true },
  });
  if (!flight) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <BookingStepper current={3} />
      <h1 className="text-3xl font-bold text-primary">Passenger details</h1>
      <p className="mt-2 mb-8 text-sm">
        {flight.flightNo}: {flight.departure.code} → {flight.arrival.code}
      </p>
      <PassengerForm
        flightId={flight.id}
        passengers={passengers}
        action={createBookingAction}
      />
    </div>
  );
}
