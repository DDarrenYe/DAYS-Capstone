const bar =
  "bg-muted block animate-pulse rounded-full motion-reduce:animate-none";

export const LogSkeleton = () => (
  <div className="grid min-h-0 flex-1 lg:grid-cols-[252px_minmax(0,1fr)_300px]">
    <output className="sr-only">Loading your log…</output>
    <div
      aria-hidden="true"
      className="flex flex-col gap-3 border-r px-5 py-5 max-lg:hidden"
    >
      <span className={`${bar} h-2.5 w-3/5`} />
      <span className={`${bar} h-1.5 w-full`} />
      {["a", "b", "c", "d"].map((row) => (
        <span className="mt-2 flex items-center gap-2.5" key={row}>
          <span className={`${bar} size-5.5 shrink-0`} />
          <span className={`${bar} h-3 flex-1`} />
        </span>
      ))}
    </div>
    <div
      aria-hidden="true"
      className="flex flex-col gap-4 px-10 py-6 max-md:px-4"
    >
      <span className={`${bar} h-3 w-32`} />
      <span className={`${bar} h-6 w-3/4`} />
      <span className="bg-muted block h-24 animate-pulse rounded-lg motion-reduce:animate-none" />
      <span className="bg-muted block h-48 animate-pulse rounded-lg motion-reduce:animate-none" />
    </div>
    <div
      aria-hidden="true"
      className="flex flex-col gap-4 border-l px-5 py-5 max-lg:hidden"
    >
      <span className="bg-muted block h-24 animate-pulse rounded-xl motion-reduce:animate-none" />
      <span className="bg-muted block h-32 animate-pulse rounded-xl motion-reduce:animate-none" />
    </div>
  </div>
);
