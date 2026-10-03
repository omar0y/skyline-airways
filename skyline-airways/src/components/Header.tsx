import Link from "next/link";
import { AirplaneTilt, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-primary transition-opacity hover:opacity-80"
        >
          <AirplaneTilt size={28} weight="fill" aria-hidden="true" />
          <span className="text-lg font-bold tracking-tight md:text-xl">
            SkyLine Airways
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-bold text-primary md:gap-3">
          <Link href="/flights" className="rounded px-2 py-2 hover:bg-muted">
            Flights
          </Link>
          <Link href="/check-in" className="rounded px-2 py-2 hover:bg-muted">
            Check-in
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="rounded px-2 py-2 hover:bg-muted">
              Admin
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/account"
                className="hidden items-center gap-1 rounded px-2 py-2 hover:bg-muted sm:flex"
              >
                <UserCircle size={20} aria-hidden="true" />
                Account
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-ghost !min-h-10 !px-3 !py-2 text-sm">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link href="/auth/login" className="btn btn-secondary !min-h-10 !px-3 !py-2 text-sm">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
