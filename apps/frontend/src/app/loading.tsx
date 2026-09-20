export default function Loading() {
  return <div role="status" aria-label="Loading page" className="space-y-6"><div className="skeleton h-5 w-32" /><div className="skeleton h-12 w-2/3" /><div className="skeleton h-60 w-full" /><div className="grid grid-cols-2 gap-5 md:grid-cols-4">{[1,2,3,4].map((n) => <div key={n} className="skeleton h-44" />)}</div><span className="sr-only">Loading…</span></div>;
}
