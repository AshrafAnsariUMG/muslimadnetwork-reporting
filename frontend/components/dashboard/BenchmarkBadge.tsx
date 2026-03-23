'use client'

interface Props {
  ctrVsBenchmark: number
}

export default function BenchmarkBadge({ ctrVsBenchmark }: Props) {
  const isAbove = ctrVsBenchmark >= 0
  const abs = Math.abs(ctrVsBenchmark)

  return (
    <div
      className="flex items-center gap-1 mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
      style={
        isAbove
          ? { backgroundColor: '#d1fae5', color: '#065f46' }
          : { backgroundColor: '#fee2e2', color: '#991b1b' }
      }
    >
      {isAbove ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
      <span>{abs.toFixed(1)}% {isAbove ? 'above' : 'below'} avg</span>
    </div>
  )
}
