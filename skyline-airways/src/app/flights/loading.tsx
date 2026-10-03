export default function FlightsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="surface h-36 animate-pulse bg-muted" />
        ))}
      </div>
    </div>
  );
}
