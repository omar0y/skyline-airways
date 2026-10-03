import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { updateProfileAction } from "@/lib/actions/booking";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (!user.customer) redirect("/");

  const c = user.customer;
  const miles = c.milesAccount;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="mb-2 text-3xl font-bold text-primary">My account</h1>
      <p className="mb-8 text-sm">{user.email}</p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="surface p-5">
          <h2 className="font-bold text-primary">SkyMiles</h2>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {miles?.flightMiles ?? 0}
          </p>
          <p className="text-sm">Account {miles?.number}</p>
          <p className="text-sm">Status miles: {miles?.statusMiles ?? 0}</p>
        </div>
        <div className="surface flex flex-col justify-center gap-3 p-5">
          <Link href="/account/bookings" className="btn btn-secondary">
            View bookings
          </Link>
          <Link href="/check-in" className="btn btn-ghost">
            Check in
          </Link>
        </div>
      </div>

      <form action={updateProfileAction} className="surface space-y-4 p-6">
        <h2 className="font-bold text-primary">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="salutation">Salutation</label>
            <input id="salutation" name="salutation" defaultValue={c.salutation || ""} />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" defaultValue={c.phone || ""} />
          </div>
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" defaultValue={c.firstName} required />
          </div>
          <div className="field">
            <label htmlFor="middleName">Middle name</label>
            <input id="middleName" name="middleName" defaultValue={c.middleName || ""} />
          </div>
          <div className="field sm:col-span-2">
            <label htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" defaultValue={c.lastName} required />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">
          Update profile
        </button>
      </form>
    </div>
  );
}
