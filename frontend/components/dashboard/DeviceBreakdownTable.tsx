import { DeviceRow } from '@/types/reports'
import { formatNumber, formatCTR } from '@/lib/dateUtils'
import VisibilityToggle from './VisibilityToggle'

interface Props {
  data: DeviceRow[]
  isImpersonating?: boolean
  isRowHidden?: (rowKey: string) => boolean
  onToggleRow?: (rowKey: string, hidden: boolean) => void
}

export default function DeviceBreakdownTable({ data, isImpersonating, isRowHidden, onToggleRow }: Props) {
  const sorted = [...data].sort((a, b) => b.impressions - a.impressions)
  const maxImpressions = sorted[0]?.impressions ?? 1

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Device</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Impressions</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Clicks</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">CTR</th>
            {isImpersonating && <th className="px-5 py-3 w-10" />}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const hidden = isRowHidden?.(row.device) ?? false
            if (!isImpersonating && hidden) return null

            return (
              <tr
                key={i}
                className="transition-colors duration-100"
                style={{
                  backgroundColor: i % 2 === 1 ? '#f8fafc' : '#ffffff',
                  opacity: hidden ? 0.3 : 1,
                }}
                onMouseEnter={(e) => !hidden && (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => !hidden && (e.currentTarget.style.backgroundColor = i % 2 === 1 ? '#f8fafc' : '#ffffff')}
              >
                <td className="px-5 py-3 font-medium text-gray-900">{row.device || '—'}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 rounded-full bg-gray-100 max-w-[80px] flex-1">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(row.impressions / maxImpressions) * 100}%`, backgroundColor: '#10b981' }}
                      />
                    </div>
                    <span className="text-gray-800 tabular-nums">{formatNumber(row.impressions)}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-[#64748b] tabular-nums">{formatNumber(row.clicks)}</td>
                <td className="px-5 py-3 text-[#64748b] tabular-nums">{formatCTR(row.ctr)}</td>
                {isImpersonating && (
                  <td className="px-5 py-3">
                    <VisibilityToggle
                      isHidden={hidden}
                      onToggle={() => onToggleRow?.(row.device, !hidden)}
                    />
                  </td>
                )}
              </tr>
            )
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={isImpersonating ? 5 : 4} className="px-5 py-8 text-center text-[#64748b] text-sm">No data available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
