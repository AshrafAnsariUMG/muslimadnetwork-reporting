'use client'

interface Props {
  lastVisitedAt: string | null | undefined
  campaignStartDate?: string
  campaignEndDate?: string
  totalImpressions?: number
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins} min ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (weeks === 1) return '1 week ago'
  if (weeks < 5) return `${weeks} weeks ago`
  if (months === 1) return '1 month ago'
  return `${months} months ago`
}

function getCampaignProgress(start?: string, end?: string): number | null {
  if (!start || !end) return null
  const s = new Date(start.includes('T') ? start : start + 'T00:00:00').getTime()
  const e = new Date(end.includes('T') ? end : end + 'T00:00:00').getTime()
  const now = Date.now()
  if (isNaN(s) || isNaN(e) || e <= s) return null
  return Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100))
}

export default function SinceLastVisit({
  lastVisitedAt,
  campaignStartDate,
  campaignEndDate,
}: Props) {
  if (!lastVisitedAt) return null

  const relativeTime = formatRelativeTime(lastVisitedAt)
  const progress = getCampaignProgress(campaignStartDate, campaignEndDate)

  return (
    <div
      className="bg-white rounded-2xl p-4 fade-in-up"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderTop: '3px solid #C9A84C', animationDelay: '75ms' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Since Your Last Visit</p>
      </div>

      <p className="text-lg font-bold text-gray-900">{relativeTime}</p>
      <p className="text-xs text-[#94a3b8] mt-0.5">Last session recorded</p>

      {progress !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-[#64748b] mb-1">
            <span>Campaign Progress</span>
            <span className="font-semibold text-gray-800">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: '#f1f5f9' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, backgroundColor: '#C9A84C', transition: 'width 600ms ease' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
