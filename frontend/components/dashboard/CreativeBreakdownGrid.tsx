'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CreativeRow, CreativeMetadata } from '@/types/reports'
import { formatNumber, formatCTR } from '@/lib/dateUtils'
import VisibilityToggle from './VisibilityToggle'
import CreativePreviewModal from './CreativePreviewModal'

interface Props {
  data: CreativeRow[]
  metadata: Record<string, CreativeMetadata>
  isLoadingMetadata: boolean
  totalImpressions: number
  isImpersonating?: boolean
  isRowHidden?: (rowKey: string) => boolean
  onToggleRow?: (rowKey: string, hidden: boolean) => void
  topPerformerName?: string
}

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'DISPLAY':      { bg: '#dbeafe', text: '#1e40af', label: 'DISPLAY' },
  'HTML5_BANNER': { bg: '#ede9fe', text: '#6d28d9', label: 'HTML5' },
  'IMAGE':        { bg: '#d1fae5', text: '#065f46', label: 'IMAGE' },
}
const DEFAULT_TYPE = { bg: '#f1f5f9', text: '#475569', label: '' }

// ── Status badge config ───────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  top_performer:       { label: '⭐ Top Performer',      bg: '#C9A84C', text: '#fff' },
  strong:              { label: '💪 Strong',             bg: '#10b981', text: '#fff' },
  refresh_opportunity: { label: '💡 Refresh Opportunity', bg: '#eff6ff', text: '#2563eb' },
  ready_for_refresh:   { label: '🔄 Ready for Refresh',  bg: '#f5f3ff', text: '#7c3aed' },
}

function StatusBadge({ row }: { row: CreativeRow }) {
  const cfg = STATUS_CONFIG[row.performance_status ?? '']
  if (!cfg) return null
  return (
    <div
      className="absolute top-8 left-2 text-xs font-bold px-2 py-0.5 rounded-full z-20 whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.text, fontSize: '10px' }}
    >
      {cfg.label}
    </div>
  )
}

function RecommendationTooltip({ text }: { text: string }) {
  return (
    <div className="relative group inline-flex items-center ml-1">
      <svg
        width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="cursor-help flex-shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white rounded-xl
                   opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-30 leading-relaxed"
        style={{ backgroundColor: '#1e293b', width: 200 }}
      >
        {text}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
          style={{ borderTopColor: '#1e293b' }}
        />
      </div>
    </div>
  )
}

function VsBenchmarkLine({ row }: { row: CreativeRow }) {
  if (row.vs_campaign_avg === undefined || row.vs_campaign_avg <= 0) return null
  return (
    <p className="text-xs tabular-nums mt-0.5" style={{ color: '#10b981' }}>
      +{row.vs_campaign_avg.toFixed(1)}% vs campaign avg
    </p>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div className="animate-pulse" style={{ height: 160, backgroundColor: '#f1f5f9' }} />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-100 animate-pulse rounded-lg w-3/4" />
        <div className="h-3 bg-gray-100 animate-pulse rounded-lg w-1/3" />
        <div className="h-1.5 bg-gray-100 animate-pulse rounded-full w-full" />
        <div className="h-3 bg-gray-100 animate-pulse rounded-lg w-2/3" />
      </div>
    </div>
  )
}

type PreviewCreative = CreativeRow & { meta?: CreativeMetadata }

function CreativeCard({
  row,
  meta,
  rank,
  totalImpressions,
  maxImpressions,
  isImpersonating,
  isHidden,
  onToggle,
  onClick,
  isTopPerformer,
}: {
  row: CreativeRow
  meta?: CreativeMetadata
  rank: number
  totalImpressions: number
  maxImpressions: number
  isImpersonating?: boolean
  isHidden: boolean
  onToggle: () => void
  onClick: () => void
  isTopPerformer?: boolean
}) {
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const typeStyle = meta?.type ? (TYPE_STYLES[meta.type] ?? DEFAULT_TYPE) : DEFAULT_TYPE
  const typeLabel = meta?.type ? (TYPE_STYLES[meta.type]?.label || meta.type) : null
  const sharePct = totalImpressions > 0 ? (row.impressions / totalImpressions * 100).toFixed(1) : '0.0'

  const isImageUrl = meta?.preview_url ? /\.(jpe?g|png|gif|webp)(\?|$)/i.test(meta.preview_url) : false

  const containerW = 260
  const iframeScale = meta?.width && meta.width > 0 ? Math.min(1, containerW / meta.width) : 1
  const iframeContainerH = meta?.width && meta?.height && meta.width > 0
    ? Math.min(160, Math.round(meta.height * iframeScale))
    : 160

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden cursor-pointer"
      style={{
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        opacity: isHidden ? 0.3 : 1,
        transition: 'all 200ms ease',
      }}
      onClick={onClick}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.border = '1px solid #C9A84C'
        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'
        el.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.border = '1px solid #e5e7eb'
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Preview */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: 160, backgroundColor: '#f8fafc' }}>
        {meta?.preview_url ? (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}
            {isImageUrl ? (
              <img
                src={meta.preview_url}
                alt={row.creative_name}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'contain', padding: 8,
                  opacity: iframeLoaded ? 1 : 0,
                  transition: 'opacity 300ms ease',
                }}
                onLoad={() => setIframeLoaded(true)}
              />
            ) : (
              <div style={{ height: iframeContainerH, overflow: 'hidden', position: 'absolute', top: 0, left: 0, right: 0 }}>
                <iframe
                  src={meta.preview_url}
                  title={row.creative_name}
                  scrolling="no"
                  style={{
                    width: meta.width || '100%',
                    height: meta.height || '100%',
                    border: 'none',
                    pointerEvents: 'none',
                    transform: iframeScale < 1 ? `scale(${iframeScale})` : 'none',
                    transformOrigin: 'top left',
                    opacity: iframeLoaded ? 1 : 0,
                    transition: 'opacity 300ms ease',
                  }}
                  onLoad={() => setIframeLoaded(true)}
                />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <span className="text-base font-mono font-bold text-gray-300">{row.size || '—'}</span>
            {typeLabel && <span className="text-xs font-semibold" style={{ color: typeStyle.text }}>{typeLabel}</span>}
          </div>
        )}

        {/* Rank badge */}
        <div
          className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white z-20"
          style={{ backgroundColor: '#2563eb' }}
        >
          {rank}
        </div>

        {/* Status badge (stacked below rank) */}
        <StatusBadge row={row} />

        {/* Type badge */}
        {typeLabel && (
          <div
            className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full z-20"
            style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
          >
            {typeLabel}
          </div>
        )}

        {/* Top Performer gold star (from 8.3 — shown when no performance_status) */}
        {isTopPerformer && !row.performance_status && (
          <div
            className="absolute bottom-2 right-2 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full z-20"
            style={{ backgroundColor: '#C9A84C', color: '#fff' }}
          >
            <svg width="9" height="9" viewBox="-5.5 -5.5 11 11">
              <polygon points="0,-5 0.79,-1.91 3.54,-3.54 1.91,-0.79 5,0 1.91,0.79 3.54,3.54 0.79,1.91 0,5 -0.79,1.91 -3.54,3.54 -1.91,0.79 -5,0 -1.91,-0.79 -3.54,-3.54 -0.79,-1.91" fill="#fff" />
            </svg>
            Top Performer
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start gap-1 mb-1">
          <p className="text-sm font-semibold text-gray-900 truncate flex-1" title={row.creative_name}>
            {row.creative_name || '—'}
          </p>
          {(row.performance_status === 'refresh_opportunity' || row.performance_status === 'ready_for_refresh') && (
            <div onClick={e => e.stopPropagation()}>
              <RecommendationTooltip text="Contact your account manager to explore creative refresh options" />
            </div>
          )}
          {row.performance_status === 'top_performer' && row.recommendation && (
            <div onClick={e => e.stopPropagation()}>
              <RecommendationTooltip text={row.recommendation} />
            </div>
          )}
        </div>

        {row.size && (
          <span
            className="inline-block text-xs font-mono font-semibold px-2 py-0.5 rounded-full mb-2"
            style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
          >
            {row.size}
          </span>
        )}

        {/* Share bar */}
        <div className="h-1.5 rounded-full w-full mb-1" style={{ backgroundColor: '#f1f5f9' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${(row.impressions / maxImpressions) * 100}%`, backgroundColor: '#2563eb' }}
          />
        </div>

        {/* vs benchmark */}
        <VsBenchmarkLine row={row} />

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-[#64748b] mt-1">
          <span className="tabular-nums">
            <span className="font-semibold text-gray-900">{formatNumber(row.impressions)}</span> impr
          </span>
          <span className="tabular-nums">{formatNumber(row.clicks)} clicks</span>
          <span className="tabular-nums font-medium" style={{ color: '#8b5cf6' }}>{formatCTR(row.ctr)}</span>
        </div>
        <p className="text-xs tabular-nums mt-0.5" style={{ color: '#94a3b8' }}>{sharePct}% of total</p>

        {/* Visibility toggle */}
        {isImpersonating && (
          <div
            className="mt-2 flex justify-end"
            onClick={e => { e.stopPropagation(); onToggle() }}
          >
            <VisibilityToggle isHidden={isHidden} onToggle={onToggle} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Creative Insights Summary bar ─────────────────────────────────────────────
function InsightsSummary({
  data,
  activeFilter,
  onFilter,
}: {
  data: CreativeRow[]
  activeFilter: string | null
  onFilter: (f: string | null) => void
}) {
  const leadingCount = data.filter(r =>
    r.performance_status === 'top_performer' || r.performance_status === 'strong'
  ).length
  const refreshCount = data.filter(r =>
    r.performance_status === 'refresh_opportunity' || r.performance_status === 'ready_for_refresh'
  ).length

  if (leadingCount + refreshCount === 0) return null

  return (
    <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
      {leadingCount > 0 && (
        <button
          onClick={() => onFilter(activeFilter === 'leading' ? null : 'leading')}
          className="text-xs font-semibold px-3 py-1 rounded-full transition-all duration-150"
          style={{
            backgroundColor: activeFilter === 'leading' ? '#C9A84C' : '#fef9ec',
            color: activeFilter === 'leading' ? '#fff' : '#92400e',
            border: '1px solid #C9A84C',
          }}
        >
          ⭐ {leadingCount} leading creative{leadingCount !== 1 ? 's' : ''}
        </button>
      )}
      {refreshCount > 0 && (
        <button
          onClick={() => onFilter(activeFilter === 'refresh' ? null : 'refresh')}
          className="text-xs font-semibold px-3 py-1 rounded-full transition-all duration-150"
          style={{
            backgroundColor: activeFilter === 'refresh' ? '#2563eb' : '#eff6ff',
            color: activeFilter === 'refresh' ? '#fff' : '#2563eb',
            border: '1px solid #2563eb',
          }}
        >
          💡 {refreshCount} refresh opportunit{refreshCount !== 1 ? 'ies' : 'y'}
        </button>
      )}
      {leadingCount > 0 && refreshCount === 0 && !activeFilter && (
        <span className="text-xs text-[#10b981] font-medium">— great performance!</span>
      )}
      {activeFilter && (
        <button
          onClick={() => onFilter(null)}
          className="text-xs text-[#64748b] hover:text-gray-900 underline transition-colors"
        >
          Clear filter
        </button>
      )}
    </div>
  )
}

export default function CreativeBreakdownGrid({
  data,
  metadata,
  isLoadingMetadata,
  totalImpressions,
  isImpersonating,
  isRowHidden,
  onToggleRow,
  topPerformerName,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [previewCreative, setPreviewCreative] = useState<PreviewCreative | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const sorted = [...data].sort((a, b) => b.impressions - a.impressions)

  // Apply status filter
  const applyFilter = (rows: CreativeRow[]) => {
    if (!activeFilter) return rows
    if (activeFilter === 'leading') return rows.filter(r =>
      r.performance_status === 'top_performer' || r.performance_status === 'strong'
    )
    if (activeFilter === 'refresh') return rows.filter(r =>
      r.performance_status === 'refresh_opportunity' || r.performance_status === 'ready_for_refresh'
    )
    return rows.filter(r => r.performance_status === activeFilter)
  }

  // Pre-filter to visible rows
  const visible = isImpersonating
    ? sorted
    : sorted.filter(row => !(isRowHidden?.(row.creative_name) ?? false))

  const filteredVisible = applyFilter(visible)
  const top6 = filteredVisible.slice(0, 6)
  const maxImpressions = sorted[0]?.impressions ?? 1

  const searchFiltered = applyFilter(
    sorted.filter(r =>
      r.creative_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.size ?? '').toLowerCase().includes(search.toLowerCase())
    )
  )

  if (isLoadingMetadata) {
    return (
      <div className="px-5 pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <div className="px-5 pb-5 text-center text-[#64748b] text-sm py-8">No creative data available.</div>
    )
  }

  return (
    <div>
      {/* Insights summary */}
      <InsightsSummary data={sorted} activeFilter={activeFilter} onFilter={setActiveFilter} />

      <div className="px-5 pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {top6.map((row, i) => {
            const hidden = isRowHidden?.(row.creative_name) ?? false
            const meta = metadata[row.creative_name]
            return (
              <CreativeCard
                key={row.creative_name}
                row={row}
                meta={meta}
                rank={i + 1}
                totalImpressions={totalImpressions}
                maxImpressions={maxImpressions}
                isImpersonating={isImpersonating}
                isHidden={hidden}
                onToggle={() => onToggleRow?.(row.creative_name, !hidden)}
                onClick={() => setPreviewCreative({ ...row, meta })}
                isTopPerformer={!!topPerformerName && row.creative_name === topPerformerName}
              />
            )
          })}
          {top6.length === 0 && activeFilter && (
            <div className="col-span-3 py-8 text-center text-[#64748b] text-sm">
              No creatives match this filter.{' '}
              <button onClick={() => setActiveFilter(null)} className="text-blue-500 underline">Clear filter</button>
            </div>
          )}
        </div>
      </div>

      {/* Show all button */}
      {filteredVisible.length > 6 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <button
            onClick={() => setModalOpen(true)}
            className="text-xs font-semibold rounded-full px-4 py-1.5 transition-colors duration-150"
            style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
          >
            Show All {filteredVisible.length} Creatives
          </button>
        </div>
      )}

      {/* All Creatives modal */}
      {modalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">All Creatives ({filteredVisible.length})</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search creatives or sizes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchFiltered.map((row, i) => {
                  const hidden = isRowHidden?.(row.creative_name) ?? false
                  const meta = metadata[row.creative_name]
                  return (
                    <CreativeCard
                      key={row.creative_name}
                      row={row}
                      meta={meta}
                      rank={i + 1}
                      totalImpressions={totalImpressions}
                      maxImpressions={maxImpressions}
                      isImpersonating={isImpersonating}
                      isHidden={hidden}
                      onToggle={() => onToggleRow?.(row.creative_name, !hidden)}
                      onClick={() => {
                        setModalOpen(false)
                        setPreviewCreative({ ...row, meta })
                      }}
                      isTopPerformer={!!topPerformerName && row.creative_name === topPerformerName}
                    />
                  )
                })}
                {searchFiltered.length === 0 && (
                  <div className="col-span-3 py-10 text-center text-[#64748b] text-sm">
                    No results for &ldquo;{search}&rdquo;
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Creative detail / preview modal */}
      {previewCreative && typeof document !== 'undefined' && createPortal(
        <CreativePreviewModal
          creative={previewCreative}
          totalImpressions={totalImpressions}
          onClose={() => setPreviewCreative(null)}
        />,
        document.body
      )}
    </div>
  )
}
