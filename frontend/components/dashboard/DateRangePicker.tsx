'use client'

import { useState } from 'react'
import { toYMD } from '@/lib/dateUtils'

interface Props {
  dateFrom: string
  dateTo: string
  onDateChange: (from: string, to: string) => void
}

type Preset = 'last7' | 'last30' | 'last90' | 'thisMonth' | 'lastMonth'

function buildPreset(preset: Preset): { from: string; to: string } {
  const today = new Date()
  const to = toYMD(today)

  if (preset === 'last7') {
    const from = new Date(today)
    from.setDate(from.getDate() - 7)
    return { from: toYMD(from), to }
  }
  if (preset === 'last30') {
    const from = new Date(today)
    from.setDate(from.getDate() - 30)
    return { from: toYMD(from), to }
  }
  if (preset === 'last90') {
    const from = new Date(today)
    from.setDate(from.getDate() - 90)
    return { from: toYMD(from), to }
  }
  if (preset === 'thisMonth') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: toYMD(from), to }
  }
  // lastMonth
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastOfLastMonth = new Date(firstOfThisMonth.getTime() - 86400000)
  const firstOfLastMonth = new Date(lastOfLastMonth.getFullYear(), lastOfLastMonth.getMonth(), 1)
  return { from: toYMD(firstOfLastMonth), to: toYMD(lastOfLastMonth) }
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'last90', label: 'Last 90 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
]

export default function DateRangePicker({ dateFrom, dateTo, onDateChange }: Props) {
  const [activePreset, setActivePreset] = useState<Preset | null>('last30')

  const applyPreset = (preset: Preset) => {
    const { from, to } = buildPreset(preset)
    setActivePreset(preset)
    onDateChange(from, to)
  }

  const isValidDate = (val: string) => /^\d{4}-\d{2}-\d{2}$/.test(val)

  const handleFromChange = (val: string) => {
    setActivePreset(null)
    if (isValidDate(val) && isValidDate(dateTo)) onDateChange(val, dateTo)
  }

  const handleToChange = (val: string) => {
    setActivePreset(null)
    if (isValidDate(dateFrom) && isValidDate(val)) onDateChange(dateFrom, val)
  }

  return (
    <div
      className="bg-white rounded-2xl p-4"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Pill preset buttons */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className="px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-150"
              style={
                activePreset === p.key
                  ? { backgroundColor: '#2563eb', color: '#fff' }
                  : { backgroundColor: '#f1f5f9', color: '#475569' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-gray-200" />

        {/* Custom date inputs */}
        <div className="flex items-center gap-2 text-sm">
          <label className="text-xs text-[#64748b] font-medium">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleFromChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <label className="text-xs text-[#64748b] font-medium">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleToChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>
    </div>
  )
}
