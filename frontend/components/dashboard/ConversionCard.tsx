import { ConversionReport } from '@/types/reports'
import { formatConversions } from '@/lib/dateUtils'
import StatCard from './StatCard'

interface Props {
  data: ConversionReport
}

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

export default function ConversionCard({ data }: Props) {
  if (!data.available) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <StatCard
        label="Total Conversions"
        value={formatConversions(data.total_conversions ?? 0)}
        icon={<CheckCircleIcon />}
        iconBg="#d1fae5"
      />
      <StatCard
        label="Total Conversion Value"
        value={`$${(data.total_conversion_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={<CheckCircleIcon />}
        iconBg="#d1fae5"
      />
    </div>
  )
}
