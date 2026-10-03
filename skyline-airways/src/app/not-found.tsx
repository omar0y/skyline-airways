import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <h1 className="text-3xl font-bold text-primary">Page not found</h1>
      <p className="mt-3 text-sm">The page you requested is not available.</p>
      <Link href="/" className="btn btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
