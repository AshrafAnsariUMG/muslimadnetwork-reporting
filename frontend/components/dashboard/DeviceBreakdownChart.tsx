'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { DeviceRow } from '@/types/reports'
import { formatNumber, formatCTR } from '@/lib/dateUtils'
import VisibilityToggle from './VisibilityToggle'

const DEVICE_COLORS: Record<string, string> = {
  'Smartphone':    '#2563eb',
  'Desktop':       '#10b981',
  'Tablet':        '#f59e0b',
  'Connected TV':  '#8b5cf6',
  'Feature Phone': '#64748b',
}
const DEFAULT_COLOR = '#e2e8f0'

function getColor(device: string): string {
  return DEVICE_COLORS[device] ?? DEFAULT_COLOR
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: DeviceRow & { percent: number } }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm shadow-lg"
      style={{ backgroundColor: '#1e293b', color: '#f8fafc', minWidth: 180 }}
    >
      <p className="font-semibold mb-1.5">{d.device}</p>
      <p className="text-xs text-slate-300">Impressions: <span className="text-white font-medium">{formatNumber(d.impressions)}</span></p>
      <p className="text-xs text-slate-300">Clicks: <span className="text-white font-medium">{formatNumber(d.clicks)}</span></p>
      <p className="text-xs text-slate-300">CTR: <span className="text-white font-medium">{formatCTR(d.ctr)}</span></p>
      <p className="text-xs text-slate-300">Share: <span className="text-white font-medium">{d.percent.toFixed(1)}%</span></p>
    </div>
  )
}

interface Props {
  data: DeviceRow[]
  isImpersonating?: boolean
  isRowHidden?: (rowKey: string) => boolean
  onToggleRow?: (rowKey: string, hidden: boolean) => void
}

export default function DeviceBreakdownChart({ data, isImpersonating, isRowHidden, onToggleRow }: Props) {
  const sorted = [...data]
    .filter(r => r.impressions > 0)
    .sort((a, b) => b.impressions - a.impressions)

  const totalImpressions = sorted.reduce((sum, r) => sum + r.impressions, 0)

  const chartData = sorted
    .filter(r => !(!isImpersonating && (isRowHidden?.(r.device) ?? false)))
    .map(r => ({
      ...r,
      percent: totalImpressions > 0 ? (r.impressions / totalImpressions) * 100 : 0,
    }))

  if (sorted.length === 0) {
    return (
      <div className="px-5 pb-5 text-center text-[#64748b] text-sm py-8">No device data available.</div>
    )
  }

  return (
    <div className="px-5 pb-5">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Doughnut chart */}
        <div className="relative flex-shrink-0 w-full sm:w-[240px]" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart width={240} height={240}>
              <Pie
                data={chartData}
                dataKey="impressions"
                nameKey="device"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={100}
                animationBegin={0}
                animationDuration={800}
                strokeWidth={2}
                stroke="#fff"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.device}
                    fill={getColor(entry.device)}
                    opacity={(isImpersonating && (isRowHidden?.(entry.device) ?? false)) ? 0.3 : 1}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ top: 0, left: 0 }}
          >
            <span className="text-lg font-bold text-gray-900 tabular-nums leading-tight">
              {formatNumber(totalImpressions)}
            </span>
            <span className="text-xs text-[#64748b] mt-0.5">Total Impressions</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2">
          {sorted.map((row) => {
            const hidden = isRowHidden?.(row.device) ?? false
            if (!isImpersonating && hidden) return null
            const percent = totalImpressions > 0 ? (row.impressions / totalImpressions) * 100 : 0
            const color = getColor(row.device)

            return (
              <div
                key={row.device}
                className="flex items-center gap-3 py-1.5"
                style={{ opacity: hidden ? 0.3 : 1, transition: 'opacity 200ms ease' }}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">{row.device}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatNumber(row.impressions)}</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {percent.toFixed(1)}%
                      </span>
                      {isImpersonating && (
                        <VisibilityToggle
                          isHidden={hidden}
                          onToggle={() => onToggleRow?.(row.device, !hidden)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
