/** Graphite shimmer placeholders while settings + links load. */
export function HubSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex flex-col items-center pt-12 pb-8">
        <div className="skeleton h-24 w-24 rounded-full" />
        <div className="skeleton h-6 w-48 rounded mt-5" />
        <div className="skeleton h-3 w-64 rounded mt-3" />
        <div className="skeleton h-3 w-52 rounded mt-3" />
      </div>
      <div className="flex flex-col gap-3.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-16 w-full rounded-[10px]" />
        ))}
      </div>
    </div>
  )
}
