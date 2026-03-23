'use client'

import { useEffect, useState } from 'react'
import { CreativeRow, CreativeMetadata } from '@/types/reports'
import { formatNumber, formatCTR } from '@/lib/dateUtils'

interface Props {
  creative: CreativeRow & { meta?: CreativeMetadata }
  totalImpressions: number
  onClose: () => void
}

const CREATIVE_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  'DISPLAY':      { bg: '#dbeafe', text: '#1e40af' },
  'HTML5_BANNER': { bg: '#ede9fe', text: '#6d28d9' },
  'IMAGE':        { bg: '#d1fae5', text: '#065f46' },
}

export default function CreativePreviewModal({ creative, totalImpressions, onClose }: Props) {
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const { meta } = creative

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const sharePct = totalImpressions > 0
    ? ((creative.impressions / totalImpressions) * 100).toFixed(1)
    : '0.0'

  const isImageUrl = meta?.preview_url ? /\.(jpe?g|png|gif|webp)(\?|$)/i.test(meta.preview_url) : false

  const maxWidth = 760
  const maxHeight = 480
  const w = meta?.width ?? 0
  const h = meta?.height ?? 0
  const scale = w > 0 && h > 0 ? Math.min(1, maxWidth / w, maxHeight / h) : 1
  const displayW = w > 0 ? Math.min(w, maxWidth) : 560
  const displayH = h > 0 ? Math.round(h * scale) : 300

  const typeStyle = meta?.type ? (CREATIVE_TYPE_STYLES[meta.type] ?? { bg: '#f1f5f9', text: '#475569' }) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
        style={{ maxWidth: 840, maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-gray-900 truncate" title={creative.creative_name}>
              {creative.creative_name || '—'}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {creative.size && (
                <span
                  className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
                >
                  {creative.size}
                </span>
              )}
              {meta?.type && typeStyle && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                >
                  {meta.type}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Preview area */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center p-6 min-h-0"
          style={{ backgroundColor: '#f8fafc' }}
        >
          {meta?.preview_url ? (
            <div
              className="relative bg-white rounded-xl overflow-hidden flex-shrink-0"
              style={{
                width: isImageUrl ? 'auto' : displayW,
                maxWidth: maxWidth,
                height: isImageUrl ? 'auto' : displayH,
                maxHeight: isImageUrl ? maxHeight : undefined,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              }}
            >
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
              {isImageUrl ? (
                <img
                  src={meta.preview_url}
                  alt={creative.creative_name}
                  style={{
                    display: 'block',
                    maxWidth: maxWidth,
                    maxHeight: maxHeight,
                    opacity: iframeLoaded ? 1 : 0,
                    transition: 'opacity 200ms ease',
                  }}
                  onLoad={() => setIframeLoaded(true)}
                />
              ) : (
              <iframe
                src={meta.preview_url}
                title={creative.creative_name}
                scrolling="no"
                style={{
                  width: w > 0 ? w : '100%',
                  height: h > 0 ? h : '100%',
                  border: 'none',
                  pointerEvents: 'none',
                  transform: scale < 1 ? `scale(${scale})` : 'none',
                  transformOrigin: 'top left',
                  opacity: iframeLoaded ? 1 : 0,
                  transition: 'opacity 200ms ease',
                }}
                onLoad={() => setIframeLoaded(true)}
              />
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-5xl font-mono font-bold text-gray-200 mb-4">{creative.size || '—'}</p>
              <p className="text-sm text-[#64748b]">Preview not available</p>
              {meta?.type && <p className="text-xs text-[#94a3b8] mt-1">{meta.type}</p>}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-8 flex-wrap mb-4">
            <div>
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide mb-0.5">Impressions</p>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{formatNumber(creative.impressions)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide mb-0.5">Clicks</p>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{formatNumber(creative.clicks)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide mb-0.5">CTR</p>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{formatCTR(creative.ctr)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide mb-0.5">Impression Share</p>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{sharePct}%</p>
            </div>
          </div>

          {/* Evaluation section */}
          {creative.performance_status && (() => {
            const statusCfg: Record<string, { label: string; bg: string; text: string }> = {
              top_performer:       { label: '⭐ Top Performer',      bg: '#C9A84C', text: '#fff' },
              strong:              { label: '💪 Strong',             bg: '#10b981', text: '#fff' },
              refresh_opportunity: { label: '💡 Refresh Opportunity', bg: '#eff6ff', text: '#2563eb' },
              ready_for_refresh:   { label: '🔄 Ready for Refresh',  bg: '#f5f3ff', text: '#7c3aed' },
              average:             { label: 'Average',               bg: '#f1f5f9', text: '#475569' },
              insufficient_data:   { label: 'Insufficient Data',     bg: '#f1f5f9', text: '#64748b' },
            }
            const cfg = statusCfg[creative.performance_status] ?? statusCfg.average
            const isRefresh = creative.performance_status === 'refresh_opportunity' || creative.performance_status === 'ready_for_refresh'
            const refreshBg = creative.performance_status === 'ready_for_refresh' ? '#f5f3ff' : '#eff6ff'
            const refreshBorder = creative.performance_status === 'ready_for_refresh' ? '#7c3aed' : '#2563eb'
            const refreshColor = creative.performance_status === 'ready_for_refresh' ? '#7c3aed' : '#2563eb'
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ backgroundColor: cfg.bg, color: cfg.text }}
                  >
                    {cfg.label}
                  </span>
                  {creative.vs_campaign_avg !== undefined && creative.vs_campaign_avg > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
                    >
                      +{creative.vs_campaign_avg.toFixed(1)}% vs campaign avg
                    </span>
                  )}
                  {creative.vs_network_avg !== undefined && creative.vs_network_avg > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}
                    >
                      +{creative.vs_network_avg.toFixed(1)}% vs network avg
                    </span>
                  )}
                </div>

                {creative.recommendation && isRefresh && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
                    style={{ backgroundColor: refreshBg, borderLeft: `3px solid ${refreshBorder}` }}
                  >
                    <span className="flex-shrink-0 mt-0.5">
                      {creative.performance_status === 'ready_for_refresh' ? '🔄' : '💡'}
                    </span>
                    <div>
                      <strong style={{ color: refreshColor }}>
                        {creative.performance_status === 'ready_for_refresh' ? 'Ready for Refresh' : 'Refresh Opportunity'}
                      </strong>
                      <p className="mt-0.5" style={{ color: '#475569' }}>{creative.recommendation}</p>
                    </div>
                  </div>
                )}

                {creative.recommendation && !isRefresh && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
                    style={{ backgroundColor: '#fef9ec', borderLeft: '3px solid #C9A84C' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span style={{ color: '#78350f' }}>{creative.recommendation}</span>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
