'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientOverview {
  client_id: number
  client_name: string
  total_hidden_sections: number
  total_hidden_rows: number
  sections_with_hidden_rows: string[]
}

interface SectionVisibility {
  section_hidden: boolean
  hidden_rows: string[]
}

type VisibilityMap = Record<string, SectionVisibility>

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS: { key: string; label: string; hasRows: boolean }[] = [
  { key: 'summary',    label: 'Summary',           hasRows: false },
  { key: 'device',     label: 'Device Breakdown',  hasRows: true  },
  { key: 'domain',     label: 'Domain Breakdown',  hasRows: true  },
  { key: 'app',        label: 'App Breakdown',      hasRows: true  },
  { key: 'creative',   label: 'Creative Breakdown', hasRows: true  },
  { key: 'conversion',     label: 'Conversion',            hasRows: false },
  { key: 'masjidconnect', label: 'MasjidConnect Section', hasRows: false },
]

const STAT_CARDS: { key: string; label: string; description: string }[] = [
  { key: 'stat_impressions', label: 'Impressions',     description: 'Total ad impressions delivered' },
  { key: 'stat_clicks',      label: 'Clicks',          description: 'Total clicks on ads' },
  { key: 'stat_ctr',         label: 'CTR',             description: 'Click-through rate with benchmark comparison' },
  { key: 'stat_muslimreach', label: 'MuslimReach',     description: 'Estimated Muslims reached (impressions ÷ 5)' },
  { key: 'stat_conversions', label: 'Conversions',     description: 'Total conversions (only shown if tracking enabled)' },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

const EyeIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      title={label}
      className="relative inline-flex items-center flex-shrink-0 rounded-full transition-colors duration-200"
      style={{
        width: 36,
        height: 20,
        backgroundColor: checked ? '#10b981' : '#d1d5db',
      }}
    >
      <span
        className="absolute rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{
          width: 14,
          height: 14,
          left: 3,
          transform: checked ? 'translateX(16px)' : 'translateX(0)',
        }}
      />
    </button>
  )
}

// ─── Client detail panel ──────────────────────────────────────────────────────

function ClientDetailPanel({
  clientId,
  clientName,
  onClose,
  showToast,
}: {
  clientId: number
  clientName: string
  onClose: () => void
  showToast: (msg: string, type: 'success' | 'error') => void
}) {
  const [settings, setSettings] = useState<VisibilityMap | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    api.get<VisibilityMap>(`/api/admin/visibility/${clientId}`)
      .then(({ data }) => setSettings(data))
      .catch(() => showToast('Failed to load visibility settings', 'error'))
      .finally(() => setLoading(false))
  }, [clientId, showToast])

  const toggleExpanded = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const toggleSection = async (sectionKey: string, currentlyHidden: boolean) => {
    if (!settings) return
    const newHidden = !currentlyHidden

    // Optimistic update
    setSettings(prev => prev ? {
      ...prev,
      [sectionKey]: { ...prev[sectionKey], section_hidden: newHidden }
    } : prev)

    try {
      await api.post(`/api/admin/visibility/${clientId}`, {
        section: sectionKey,
        level: 'section',
        row_key: null,
        is_hidden: newHidden,
      })
      showToast(newHidden ? `"${sectionKey}" section hidden` : `"${sectionKey}" section visible`, 'success')
    } catch {
      // Revert
      setSettings(prev => prev ? {
        ...prev,
        [sectionKey]: { ...prev[sectionKey], section_hidden: currentlyHidden }
      } : prev)
      showToast('Failed to save', 'error')
    }
  }

  const unhideRow = async (sectionKey: string, rowKey: string) => {
    if (!settings) return

    // Optimistic update
    setSettings(prev => {
      if (!prev) return prev
      const sec = prev[sectionKey]
      return {
        ...prev,
        [sectionKey]: { ...sec, hidden_rows: sec.hidden_rows.filter(r => r !== rowKey) }
      }
    })

    try {
      await api.post(`/api/admin/visibility/${clientId}`, {
        section: sectionKey,
        level: 'row',
        row_key: rowKey,
        is_hidden: false,
      })
      showToast(`Row "${rowKey}" is now visible`, 'success')
    } catch {
      // Revert
      setSettings(prev => {
        if (!prev) return prev
        const sec = prev[sectionKey]
        return {
          ...prev,
          [sectionKey]: { ...sec, hidden_rows: [...sec.hidden_rows, rowKey] }
        }
      })
      showToast('Failed to save', 'error')
    }
  }

  if (loading) {
    return (
      <div className="mt-6 bg-white rounded-2xl p-8 text-center text-sm text-gray-400" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        Loading visibility settings…
      </div>
    )
  }

  if (!settings) return null

  const totalHiddenSections =
    SECTIONS.filter(s => settings[s.key]?.section_hidden).length +
    STAT_CARDS.filter(c => settings[c.key]?.section_hidden).length
  const totalHiddenRows = SECTIONS.reduce((n, s) => n + (settings[s.key]?.hidden_rows?.length ?? 0), 0)
  const hiddenStatCount = STAT_CARDS.filter(c => settings[c.key]?.section_hidden).length
  const summaryCardsKey = '__summary_cards__'

  return (
    <div className="mt-6 bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      {/* Panel header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900">{clientName}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalHiddenSections} section{totalHiddenSections !== 1 ? 's' : ''} hidden · {totalHiddenRows} row{totalHiddenRows !== 1 ? 's' : ''} hidden
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          title="Close panel"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Sections */}
      <div className="divide-y divide-gray-100">

        {/* ── Summary Cards accordion ── */}
        <div>
          <div className="flex items-center gap-4 px-6 py-4">
            <button
              onClick={() => toggleExpanded(summaryCardsKey)}
              className="flex items-center gap-3 flex-1 text-left"
            >
              <span className="font-medium text-sm text-gray-800">Summary Cards</span>
              {hiddenStatCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                  {hiddenStatCount} card{hiddenStatCount !== 1 ? 's' : ''} hidden
                </span>
              )}
            </button>
            <button
              onClick={() => toggleExpanded(summaryCardsKey)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronIcon open={expandedSections.has(summaryCardsKey)} />
            </button>
          </div>

          {expandedSections.has(summaryCardsKey) && (
            <div className="px-6 pb-4 space-y-2">
              {STAT_CARDS.map((card) => {
                const isHidden = settings[card.key]?.section_hidden ?? false
                return (
                  <div
                    key={card.key}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: isHidden ? '#fff5f5' : '#f8fafc',
                      border: `1px solid ${isHidden ? '#fecaca' : 'transparent'}`,
                    }}
                  >
                    <div>
                      <p className={`text-sm font-medium ${isHidden ? 'text-red-400 line-through' : 'text-gray-800'}`}>
                        {card.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{card.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <span className="text-xs text-gray-400">{isHidden ? 'Hidden' : 'Visible'}</span>
                      <Toggle
                        checked={!isHidden}
                        onChange={() => toggleSection(card.key, isHidden)}
                        label={isHidden ? 'Show card' : 'Hide card'}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {SECTIONS.map((section) => {
          const vis = settings[section.key] ?? { section_hidden: false, hidden_rows: [] }
          const isExpanded = expandedSections.has(section.key)
          const hiddenRowCount = vis.hidden_rows.length
          const sectionHidden = vis.section_hidden

          return (
            <div key={section.key}>
              {/* Section row */}
              <div className="flex items-center gap-4 px-6 py-4">
                {/* Expand arrow (only for sections with rows) */}
                <button
                  onClick={() => section.hasRows && toggleExpanded(section.key)}
                  className="flex items-center gap-3 flex-1 text-left"
                  style={{ cursor: section.hasRows ? 'pointer' : 'default' }}
                >
                  <span className={`font-medium text-sm ${sectionHidden ? 'text-red-400 line-through' : 'text-gray-800'}`}>
                    {section.label}
                  </span>
                  {sectionHidden && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                      Section hidden
                    </span>
                  )}
                  {!sectionHidden && hiddenRowCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                      {hiddenRowCount} row{hiddenRowCount !== 1 ? 's' : ''} hidden
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {sectionHidden ? 'Hidden' : 'Visible'}
                  </span>
                  <Toggle
                    checked={!sectionHidden}
                    onChange={() => toggleSection(section.key, sectionHidden)}
                    label={sectionHidden ? 'Show section' : 'Hide section'}
                  />
                  {section.hasRows && (
                    <button
                      onClick={() => toggleExpanded(section.key)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ChevronIcon open={isExpanded} />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded rows */}
              {section.hasRows && isExpanded && (
                <div className="px-6 pb-4">
                  {vis.hidden_rows.length === 0 ? (
                    <div
                      className="rounded-xl px-4 py-3 text-xs text-green-700 flex items-center gap-2"
                      style={{ backgroundColor: '#f0fdf4' }}
                    >
                      <EyeIcon size={13} />
                      All rows are visible — no rows currently hidden
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Hidden Rows</p>
                      {vis.hidden_rows.map((rowKey) => (
                        <div
                          key={rowKey}
                          className="flex items-center justify-between rounded-lg px-4 py-2.5"
                          style={{ backgroundColor: '#fff5f5', border: '1px solid #fecaca' }}
                        >
                          <div className="flex items-center gap-2">
                            <span style={{ color: '#dc2626' }}><EyeOffIcon size={13} /></span>
                            <span className="text-sm text-gray-700 truncate max-w-xs" title={rowKey}>{rowKey}</span>
                          </div>
                          <button
                            onClick={() => unhideRow(section.key, rowKey)}
                            className="text-xs font-semibold px-3 py-1 rounded-full transition-colors ml-3 flex-shrink-0"
                            style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}
                          >
                            Make Visible
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VisibilityPage() {
  const [overview, setOverview] = useState<ClientOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [selectedClientName, setSelectedClientName] = useState('')
  const [resetting, setResetting] = useState<number | null>(null)
  const { showToast, ToastContainer } = useToast()

  const fetchOverview = useCallback(() => {
    api.get<ClientOverview[]>('/api/admin/visibility/overview')
      .then(({ data }) => setOverview(data))
      .catch(() => showToast('Failed to load overview', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])

  useEffect(() => { fetchOverview() }, [fetchOverview])

  const handleManage = (client: ClientOverview) => {
    if (selectedClientId === client.client_id) {
      setSelectedClientId(null)
    } else {
      setSelectedClientId(client.client_id)
      setSelectedClientName(client.client_name)
    }
  }

  const handleReset = async (client: ClientOverview) => {
    if (!confirm(`Reset all visibility settings for "${client.client_name}"? This will make everything visible again.`)) return
    setResetting(client.client_id)
    try {
      await api.delete(`/api/admin/visibility/${client.client_id}/reset`)
      showToast(`All visibility settings reset for ${client.client_name}`, 'success')
      fetchOverview()
      if (selectedClientId === client.client_id) setSelectedClientId(null)
    } catch {
      showToast('Failed to reset', 'error')
    } finally {
      setResetting(null)
    }
  }

  return (
    <div>
      <ToastContainer />

      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Visibility Management</h1>
        <p className="text-sm text-gray-500 mt-1">Control what each client sees in their dashboard</p>
      </div>

      {/* Overview cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
          ))}
        </div>
      ) : overview.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-400" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          No clients found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {overview.map((client) => {
            const nothingHidden = client.total_hidden_sections === 0 && client.total_hidden_rows === 0
            const isSelected = selectedClientId === client.client_id

            return (
              <div
                key={client.client_id}
                className="bg-white rounded-2xl p-5 flex flex-col gap-4 transition-all duration-150"
                style={{
                  boxShadow: isSelected
                    ? '0 0 0 2px #2563eb, 0 2px 12px rgba(0,0,0,0.08)'
                    : '0 2px 12px rgba(0,0,0,0.08)',
                }}
              >
                {/* Client name + badge */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug">{client.client_name}</h3>
                  {nothingHidden ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
                      All Visible
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                      Has Hidden
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{client.total_hidden_sections}</p>
                    <p className="text-xs text-gray-400">sections hidden</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{client.total_hidden_rows}</p>
                    <p className="text-xs text-gray-400">rows hidden</p>
                  </div>
                </div>

                {/* Affected sections */}
                {client.sections_with_hidden_rows.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {client.sections_with_hidden_rows.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleManage(client)}
                    className="flex-1 text-xs font-semibold py-2 rounded-full transition-colors"
                    style={{
                      backgroundColor: isSelected ? '#2563eb' : '#eff6ff',
                      color: isSelected ? '#fff' : '#2563eb',
                    }}
                  >
                    {isSelected ? 'Close' : 'Manage'}
                  </button>
                  {!nothingHidden && (
                    <button
                      onClick={() => handleReset(client)}
                      disabled={resetting === client.client_id}
                      className="flex-1 text-xs font-semibold py-2 rounded-full transition-colors disabled:opacity-60"
                      style={{ backgroundColor: '#fff5f5', color: '#dc2626' }}
                    >
                      {resetting === client.client_id ? 'Resetting…' : 'Reset All'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail panel */}
      {selectedClientId !== null && (
        <ClientDetailPanel
          key={selectedClientId}
          clientId={selectedClientId}
          clientName={selectedClientName}
          onClose={() => setSelectedClientId(null)}
          showToast={showToast}
        />
      )}
    </div>
  )
}
