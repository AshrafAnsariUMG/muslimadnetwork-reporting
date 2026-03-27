'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AppRow } from '@/types/reports'
import { formatNumber, formatCTR } from '@/lib/dateUtils'
import VisibilityToggle from './VisibilityToggle'
import AppIcon from '@/components/ui/AppIcon'

function AppAvatar({ row, rank }: { row: AppRow; rank: number }) {
  return (
    <div className="flex flex-col items-center flex-shrink-0" style={{ width: 40 }}>
      <AppIcon appId={row.app_id} appName={row.app} size={32} />
      <span className="text-[10px] text-[#94a3b8] mt-0.5 tabular-nums">#{rank}</span>
    </div>
  )
}

interface Props {
  data: AppRow[]
  totalImpressions: number
  isImpersonating?: boolean
  isRowHidden?: (rowKey: string) => boolean
  onToggleRow?: (rowKey: string, hidden: boolean) => void
}

export default function AppBreakdownCards({
  data,
  totalImpressions,
  isImpersonating,
  isRowHidden,
  onToggleRow,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const sorted = [...data].sort((a, b) => b.impressions - a.impressions)
  const top10 = sorted.slice(0, 10)
  // Pre-filter so rank numbers are always sequential among visible rows
  const visibleTop10 = isImpersonating
    ? top10
    : top10.filter(row => !(isRowHidden?.(row.app) ?? false))

  const filtered = sorted.filter(r =>
    r.app.toLowerCase().includes(search.toLowerCase())
  )

  if (sorted.length === 0) {
    return (
      <div className="px-5 pb-5 text-center text-[#64748b] text-sm py-8">No app data available.</div>
    )
  }

  return (
    <div className="px-5 pb-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleTop10.map((row, i) => {
          const hidden = isRowHidden?.(row.app) ?? false
          const sharePercent = totalImpressions > 0
            ? (row.impressions / totalImpressions) * 100
            : 0

          return (
            <div
              key={row.app}
              className="bg-white rounded-xl px-4 py-3 flex items-start gap-3"
              style={{
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                opacity: hidden ? 0.35 : 1,
                transition: 'all 200ms ease',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                if (hidden) return
                const el = e.currentTarget as HTMLDivElement
                el.style.border = '1px solid #C9A84C'
                el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'
                el.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.border = '1px solid #e5e7eb'
                el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'
                el.style.transform = 'translateY(0)'
              }}
            >
              <AppAvatar row={row} rank={i + 1} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="text-sm font-semibold text-gray-900 truncate block"
                    title={row.app}
                    style={{ maxWidth: '180px' }}
                  >
                    {row.app || '—'}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-base font-bold tabular-nums" style={{ color: '#2563eb' }}>
                      {formatNumber(row.impressions)}
                    </span>
                    {isImpersonating && (
                      <VisibilityToggle
                        isHidden={hidden}
                        onToggle={() => onToggleRow?.(row.app, !hidden)}
                      />
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-2 text-xs text-[#64748b] flex gap-3">
                  <span>Clicks: <span className="font-medium text-gray-700">{formatNumber(row.clicks)}</span></span>
                  <span>CTR: <span className="font-medium text-gray-700">{formatCTR(row.ctr)}</span></span>
                  <span className="ml-auto">{sharePercent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* View all button */}
      {sorted.length > 10 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setModalOpen(true)}
            className="text-sm font-semibold px-5 py-2 rounded-full transition-colors"
            style={{ backgroundColor: '#ede9fe', color: '#8b5cf6' }}
          >
            View All {sorted.length} Apps
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">All Apps ({sorted.length})</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search apps…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
            </div>

            {/* Table */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">#</th>
                    <th className="text-left px-6 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">App</th>
                    <th className="text-right px-6 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Impressions</th>
                    <th className="text-right px-6 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Clicks</th>
                    <th className="text-right px-6 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr
                      key={row.app}
                      className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-2.5 text-xs text-[#64748b] tabular-nums">{i + 1}</td>
                      <td className="px-6 py-2.5 font-medium text-gray-900 max-w-xs truncate" title={row.app}>{row.app}</td>
                      <td className="px-6 py-2.5 text-right tabular-nums text-gray-800">{formatNumber(row.impressions)}</td>
                      <td className="px-6 py-2.5 text-right tabular-nums text-[#64748b]">{formatNumber(row.clicks)}</td>
                      <td className="px-6 py-2.5 text-right tabular-nums text-[#64748b]">{formatCTR(row.ctr)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[#64748b]">No results for &ldquo;{search}&rdquo;</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
