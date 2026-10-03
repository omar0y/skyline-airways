import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <p className="font-bold text-primary">SkyLine Airways</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/flights" className="hover:text-primary">
            Search flights
          </Link>
          <Link href="/check-in" className="hover:text-primary">
            Online check-in
          </Link>
          <Link href="/account" className="hover:text-primary">
            My account
          </Link>
        </div>
        <p>© {new Date().getFullYear()} SkyLine Airways</p>
      </div>
    </footer>
  );
}
