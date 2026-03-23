'use client'

import { useState } from 'react'
import { CreativeRow } from '@/types/reports'
import { formatNumber, formatCTR } from '@/lib/dateUtils'
import VisibilityToggle from './VisibilityToggle'

interface Props {
  data: CreativeRow[]
  isImpersonating?: boolean
  isRowHidden?: (rowKey: string) => boolean
  onToggleRow?: (rowKey: string, hidden: boolean) => void
}

export default function CreativeBreakdownTable({ data, isImpersonating, isRowHidden, onToggleRow }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const sorted = [...data].sort((a, b) => b.impressions - a.impressions)
  const top10 = sorted.slice(0, 10)
  // Pre-filter so rank numbers are always sequential among visible rows
  const displayed = isImpersonating
    ? top10
    : top10.filter(row => !(isRowHidden?.(row.creative_name) ?? false))
  const maxImpressions = sorted[0]?.impressions ?? 1

  const filtered = sorted.filter(r =>
    r.creative_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.size ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide w-10">#</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Creative</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Size</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Impressions</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Clicks</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">CTR</th>
              {isImpersonating && <th className="px-5 py-3 w-10" />}
            </tr>
          </thead>
          <tbody>
            {displayed.map((row, i) => {
              const hidden = isRowHidden?.(row.creative_name) ?? false
              const truncated = row.creative_name.length > 30
                ? row.creative_name.slice(0, 30) + '…'
                : row.creative_name

              return (
                <tr
                  key={i}
                  className="border-t border-gray-50 transition-colors duration-100"
                  style={{
                    backgroundColor: i % 2 === 1 ? '#f8fafc' : '#ffffff',
                    opacity: hidden ? 0.3 : 1,
                  }}
                  onMouseEnter={e => !hidden && (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={e => !hidden && (e.currentTarget.style.backgroundColor = i % 2 === 1 ? '#f8fafc' : '#ffffff')}
                >
                  <td className="px-5 py-3 text-xs font-bold text-[#64748b] tabular-nums">#{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-gray-900" title={row.creative_name}>
                    {truncated || '—'}
                  </td>
                  <td className="px-5 py-3">
                    {row.size ? (
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full font-mono"
                        style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
                      >
                        {row.size}
                      </span>
                    ) : (
                      <span className="text-[#64748b]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 rounded-full bg-gray-100 w-16 flex-shrink-0">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(row.impressions / maxImpressions) * 100}%`,
                            backgroundColor: '#2563eb',
                          }}
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
                        onToggle={() => onToggleRow?.(row.creative_name, !hidden)}
                      />
                    </td>
                  )}
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={isImpersonating ? 7 : 6} className="px-5 py-8 text-center text-[#64748b] text-sm">No data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View all button */}
      {sorted.length > 10 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <button
            onClick={() => setModalOpen(true)}
            className="text-xs font-semibold rounded-full px-4 py-1.5 transition-colors duration-150"
            style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
          >
            View All {sorted.length} Creatives
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">All Creatives ({sorted.length})</h3>
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
                placeholder="Search creatives or sizes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Table */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">#</th>
                    <th className="text-left px-6 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Creative</th>
                    <th className="text-left px-6 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Size</th>
                    <th className="text-right px-6 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Impressions</th>
                    <th className="text-right px-6 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Clicks</th>
                    <th className="text-right px-6 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-2.5 text-xs text-[#64748b] tabular-nums">{i + 1}</td>
                      <td className="px-6 py-2.5 font-medium text-gray-900 max-w-xs" title={row.creative_name}>
                        <span className="block truncate">{row.creative_name || '—'}</span>
                      </td>
                      <td className="px-6 py-2.5">
                        {row.size ? (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full font-mono"
                            style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
                          >
                            {row.size}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-2.5 text-right tabular-nums text-gray-800">{formatNumber(row.impressions)}</td>
                      <td className="px-6 py-2.5 text-right tabular-nums text-[#64748b]">{formatNumber(row.clicks)}</td>
                      <td className="px-6 py-2.5 text-right tabular-nums text-[#64748b]">{formatCTR(row.ctr)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[#64748b]">No results for &ldquo;{search}&rdquo;</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
