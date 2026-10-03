import { prisma } from "@/lib/db";
import { SearchForm } from "@/components/SearchForm";
import { format } from "date-fns";

export default async function HomePage() {
  const airports = await prisma.airport.findMany({ orderBy: { city: "asc" } });
  const defaultDate = format(new Date(Date.now() + 3 * 86400000), "yyyy-MM-dd");

  return (
    <section className="hero-sky relative min-h-[calc(100vh-4rem)] overflow-hidden text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 80%, rgba(255,255,255,0.18) 0 2px, transparent 3px), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.12) 0 1px, transparent 2px)",
          backgroundSize: "120px 120px, 80px 80px",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-16 md:px-6">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-blue-100">
          SkyLine Airways
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl">
          Fly farther with clarity
        </h1>
        <p className="mt-4 max-w-xl text-lg text-blue-100">
          Search routes, reserve seats, and manage your journey in one place.
        </p>

        <div className="mt-10 w-full max-w-5xl rounded-lg bg-card p-5 text-muted-foreground shadow-xl md:p-6">
          <SearchForm
            airports={airports}
            defaults={{
              source: "CAI",
              destination: "DXB",
              travelDate: defaultDate,
              passengers: "1",
            }}
          />
        </div>
      </div>
    </section>
  );
}
