import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();

  const [flights, users, bookings, tickets] = await Promise.all([
    prisma.flight.count(),
    prisma.user.count(),
    prisma.booking.count(),
    prisma.ticket.count({ where: { status: "ISSUED" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="mb-2 text-3xl font-bold text-primary">Admin dashboard</h1>
      <p className="mb-8 text-sm">Manage flights, users, and bookings.</p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Flights", flights],
          ["Users", users],
          ["Bookings", bookings],
          ["Open tickets", tickets],
        ].map(([label, value]) => (
          <div key={label as string} className="surface p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold text-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/flights" className="btn btn-primary">
          Manage flights
        </Link>
        <Link href="/admin/users" className="btn btn-secondary">
          Manage users
        </Link>
        <Link href="/admin/bookings" className="btn btn-ghost">
          Manage bookings
        </Link>
      </div>
    </div>
  );
}
