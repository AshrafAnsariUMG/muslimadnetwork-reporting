import { Skeleton } from './Skeleton'

export default function StatCardSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col"
      style={{
        border: '1px solid #C9A84C',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        minHeight: 112,
      }}
    >
      {/* Icon */}
      <Skeleton style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 12 }} />
      {/* Label */}
      <Skeleton style={{ height: 10, borderRadius: 5, width: 72, marginBottom: 9 }} />
      {/* Value */}
      <Skeleton style={{ height: 28, borderRadius: 7, width: 110 }} />
    </div>
  )
}
