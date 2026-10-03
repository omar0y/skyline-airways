import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingStepper } from "@/components/BookingStepper";
import { DuffelPassengerForm } from "@/components/DuffelPassengerForm";
import { bookDuffelOfferAction } from "@/lib/actions/duffel-booking";
import { getCurrentUser } from "@/lib/auth";
import { duffelErrorMessage, getDuffel, offerToCard } from "@/lib/duffel";
import { formatDateTime, formatMoney } from "@/lib/format";

export const metadata = { title: "Book flight" };
export const dynamic = "force-dynamic";

export default async function DuffelBookPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const user = await getCurrentUser();
  const { offerId } = await params;

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/book/offer/${offerId}`)}`);
  }

  if (!user.customer) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="surface p-8 text-center" role="alert">
          <h1 className="text-xl font-bold text-primary">Customers only</h1>
          <p className="mt-2 text-sm">Sign in with a customer account to book.</p>
        </div>
      </div>
    );
  }

  if (!/^off_[A-Za-z0-9]+$/.test(offerId)) {
    return (
      <Message title="Offer not found" body="That flight link is not valid. Search again." />
    );
  }

  try {
    const response = await getDuffel().offers.get(offerId);
    const offer = response.data;
    const card = offerToCard(offer, offer.passengers.length);
    if (!card) {
      return <Message title="Offer unavailable" body="This flight no longer has a bookable itinerary." />;
    }

    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <BookingStepper current={3} />
        <h1 className="text-3xl font-bold text-primary">Passenger details</h1>
        <p className="mt-2 mb-6 text-sm">
          {card.flightNo}: {card.departure.code} → {card.arrival.code} ·{" "}
          {formatDateTime(card.departureTime)} ·{" "}
          {formatMoney(Number(offer.total_amount), offer.total_currency)} total
        </p>
        <DuffelPassengerForm
          offerId={offer.id}
          passengers={offer.passengers.length}
          email={user.email}
          action={bookDuffelOfferAction}
        />
      </div>
    );
  } catch (error) {
    return <Message title="Could not load this flight" body={duffelErrorMessage(error)} />;
  }
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <div className="surface p-8 text-center" role="alert">
        <h1 className="text-xl font-bold text-primary">{title}</h1>
        <p className="mt-2 text-sm">{body}</p>
        <Link href="/flights" className="btn btn-primary mt-6 inline-flex">
          Back to search
        </Link>
      </div>
    </div>
  );
}
