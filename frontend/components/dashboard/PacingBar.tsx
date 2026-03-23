'use client'

import { useEffect, useState } from 'react'
import { formatNumber, getPacingPercentage } from '@/lib/dateUtils'

interface Props {
  contracted: number
  delivered: number
  startDate: string
  endDate: string
}

const InfoTooltip = () => (
  <div className="relative group inline-flex items-center">
    <svg
      width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="text-[#94a3b8] cursor-help"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 text-xs text-white rounded-lg
                 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10 leading-relaxed"
      style={{ backgroundColor: '#1e293b' }}
    >
      Pacing is calculated from campaign start date to today, independent of the date range filter above.
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
        style={{ borderTopColor: '#1e293b' }}
      />
    </div>
  </div>
)

export default function PacingBar({ contracted, delivered, startDate, endDate }: Props) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 50)
    return () => clearTimeout(t)
  }, [delivered, contracted])

  if (contracted <= 0) return null

  const start = new Date(startDate.includes('T') ? startDate : startDate + 'T00:00:00').getTime()
  const end = new Date(endDate.includes('T') ? endDate : endDate + 'T00:00:00').getTime()
  if (isNaN(start) || isNaN(end)) return null

  const deliveredPct = Math.min((delivered / contracted) * 100, 100)
  const today = Date.now()
  const totalDays = (end - start) / 86400000
  const elapsedDays = Math.min(Math.max((today - start) / 86400000, 0), totalDays)
  const expectedPct = totalDays > 0 ? Math.min((elapsedDays / totalDays) * 100, 100) : 0

  const pacingRatio = getPacingPercentage(delivered, contracted, startDate, endDate)

  let barColor = '#10b981'
  let pacingLabel = 'On pace'
  let badgeBg = '#ffffff'
  let badgeText = '#C9A84C'
  let badgeBorder = '1px solid #C9A84C'

  if (pacingRatio < 75) {
    barColor = '#ef4444'
    pacingLabel = 'Behind pace'
    badgeBg = '#fee2e2'
    badgeText = '#991b1b'
    badgeBorder = 'none'
  } else if (pacingRatio < 90) {
    barColor = '#f59e0b'
    pacingLabel = 'Slightly behind'
    badgeBg = '#fef3c7'
    badgeText = '#92400e'
    badgeBorder = 'none'
  }

  return (
    <div
      className="bg-white rounded-2xl p-5 fade-in-up"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', animationDelay: '150ms' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Impression Pacing</p>
          <InfoTooltip />
        </div>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{ backgroundColor: badgeBg, color: badgeText, border: badgeBorder }}
        >
          {pacingLabel}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-3 rounded-full overflow-hidden mb-3" style={{ backgroundColor: '#f1f5f9' }}>
        {/* Delivered fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: animated ? `${deliveredPct}%` : '0%',
            backgroundColor: barColor,
            transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)',
          }}
        />
        {/* Expected marker */}
        <div
          className="absolute top-0 h-full w-0.5"
          style={{ left: `${expectedPct}%`, backgroundColor: 'rgba(100,116,139,0.5)' }}
          title={`Expected: ${expectedPct.toFixed(1)}% by today`}
        />
      </div>

      <p className="text-xs text-[#64748b]">
        <span className="font-semibold text-gray-800">{formatNumber(delivered)}</span>
        {' '}of{' '}
        <span className="font-semibold text-gray-800">{formatNumber(contracted)}</span>
        {' '}contracted impressions delivered{' '}
        <span style={{ color: barColor }} className="font-medium">
          ({deliveredPct.toFixed(1)}% delivered · {expectedPct.toFixed(1)}% expected · as of today)
        </span>
      </p>
    </div>
  )
}
