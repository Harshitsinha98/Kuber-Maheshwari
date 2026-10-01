/** Shown instantly when an event is clicked, while the page loads. */
export default function EventLoading() {
  return (
    <div aria-busy="true" aria-label="Loading event">
      <div className="relative h-[78vh] min-h-[520px] overflow-hidden bg-night-2">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-night via-ink to-night-2" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1500px] px-5 pb-14 md:px-10">
          <div className="h-3 w-32 animate-pulse rounded bg-saffron/40" />
          <div className="mt-6 h-14 w-3/4 max-w-3xl animate-pulse rounded bg-ivory/10 md:h-24" />
          <div className="mt-4 h-5 w-1/2 max-w-xl animate-pulse rounded bg-ivory/10" />
        </div>
      </div>
      <div className="mx-auto grid max-w-[1500px] gap-16 px-5 py-20 md:px-10 lg:grid-cols-[1fr_460px]">
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded bg-ivory/5" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-ivory/5" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-ivory/5" />
        </div>
        <div className="h-96 animate-pulse border border-ivory/10 bg-night-2/80" />
      </div>
    </div>
  );
}
