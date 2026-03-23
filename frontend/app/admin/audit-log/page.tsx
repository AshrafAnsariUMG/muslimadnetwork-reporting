'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: number
  action: string
  metadata: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  admin_user: { id: number; name: string } | null
  impersonating_client: { id: number; name: string } | null
}

interface AdminOption {
  id: number
  name: string
}

interface AuditResponse {
  data: AuditEntry[]
  total: number
  current_page: number
  last_page: number
  per_page: number
  admins: AdminOption[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'impersonation_started', label: 'Impersonation Started' },
  { value: 'impersonation_stopped', label: 'Impersonation Stopped' },
  { value: 'onboarding_email_sent', label: 'Onboarding Email Sent' },
  { value: 'password_reset',        label: 'Password Reset' },
]

const ACTION_BADGE: Record<string, { bg: string; text: string }> = {
  impersonation_started: { bg: '#dbeafe', text: '#1e40af' },
  impersonation_stopped: { bg: '#eff6ff', text: '#3b82f6' },
  onboarding_email_sent: { bg: '#d1fae5', text: '#065f46' },
  password_reset:        { bg: '#fef3c7', text: '#92400e' },
}

function getActionBadge(action: string) {
  return ACTION_BADGE[action] ?? { bg: '#f1f5f9', text: '#64748b' }
}

function humanAction(entry: AuditEntry): string {
  switch (entry.action) {
    case 'impersonation_started':
      return `Impersonated ${entry.impersonating_client?.name ?? 'client'}`
    case 'impersonation_stopped':
      return 'Stopped impersonation'
    case 'onboarding_email_sent':
      return 'Sent onboarding email'
    case 'password_reset':
      return 'Reset password'
    default:
      return entry.action.replace(/_/g, ' ')
  }
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [admins, setAdmins] = useState<AdminOption[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [action, setAction] = useState('')
  const [adminId, setAdminId] = useState('')

  const fetchData = useCallback((page = 1) => {
    setLoading(true)
    const params: Record<string, string> = { page: String(page) }
    if (dateFrom)  params.date_from = dateFrom
    if (dateTo)    params.date_to   = dateTo
    if (action)    params.action    = action
    if (adminId)   params.admin_id  = adminId

    api.get<AuditResponse>('/api/admin/audit-log', { params })
      .then(({ data }) => {
        setEntries(data.data)
        setTotal(data.total)
        setCurrentPage(data.current_page)
        setLastPage(data.last_page)
        setPerPage(data.per_page)
        if (data.admins.length > 0) setAdmins(data.admins)
      })
      .finally(() => setLoading(false))
  }, [dateFrom, dateTo, action, adminId])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setAction('')
    setAdminId('')
    setCurrentPage(1)
  }

  const handleExportCSV = () => {
    const headers = ['Time', 'Admin', 'Action', 'Client', 'IP Address', 'Details']
    const rows = entries.map(e => [
      formatDateTime(e.created_at),
      e.admin_user?.name ?? '',
      e.action,
      e.impersonating_client?.name ?? '',
      e.ip_address ?? '',
      e.metadata ? JSON.stringify(e.metadata) : '',
    ])

    const csv = [headers, ...rows]
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1
  const to   = Math.min(currentPage * perPage, total)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">Audit Log</h1>
        <button
          onClick={handleExportCSV}
          disabled={entries.length === 0}
          className="px-4 py-2 text-sm font-semibold rounded-full disabled:opacity-50 transition-colors"
          style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-end" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#64748b]">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#64748b]">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#64748b]">Action</label>
          <select value={action} onChange={e => setAction(e.target.value)} className={inputCls}>
            {ACTION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#64748b]">Admin</label>
          <select value={adminId} onChange={e => setAdminId(e.target.value)} className={inputCls}>
            <option value="">All Admins</option>
            {admins.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={clearFilters}
          className="px-4 py-2 text-sm font-medium border border-gray-200 text-[#64748b] rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        {/* Count row */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs text-[#64748b]">
            {loading ? 'Loading…' : total === 0 ? 'No entries found' : `Showing ${from}–${to} of ${total} entries`}
          </span>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-[#64748b] text-sm animate-pulse">Loading audit log…</div>
        ) : entries.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#64748b] text-sm">No log entries match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Time</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Admin</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">IP</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const badge = getActionBadge(entry.action)
                  const isExpanded = expandedId === entry.id
                  const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0

                  return (
                    <>
                      <tr
                        key={entry.id}
                        className="border-t border-gray-50 transition-colors duration-100"
                        style={{ backgroundColor: i % 2 === 1 ? '#f8fafc' : '#fff' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 1 ? '#f8fafc' : '#fff')}
                      >
                        <td className="px-5 py-3 text-[#64748b] whitespace-nowrap" title={relativeTime(entry.created_at)}>
                          {formatDateTime(entry.created_at)}
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-900">
                          {entry.admin_user?.name ?? '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: badge.bg, color: badge.text }}
                          >
                            {humanAction(entry)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[#64748b]">
                          {entry.impersonating_client?.name ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-[#64748b] font-mono text-xs">
                          {entry.ip_address ?? '—'}
                        </td>
                        <td className="px-5 py-3">
                          {hasMetadata ? (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                              className="text-xs font-semibold px-3 py-1 rounded-full transition-colors"
                              style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
                            >
                              {isExpanded ? 'Hide' : 'Show'}
                            </button>
                          ) : (
                            <span className="text-xs text-[#64748b]">—</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && hasMetadata && (
                        <tr key={`${entry.id}-expanded`} className="border-t border-blue-50">
                          <td colSpan={6} className="px-5 py-3" style={{ backgroundColor: '#f8fafc' }}>
                            <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap rounded-lg p-3 overflow-x-auto"
                              style={{ backgroundColor: '#f1f5f9', maxHeight: 200 }}>
                              {JSON.stringify(entry.metadata, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-[#64748b]">
              Page {currentPage} of {lastPage}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => fetchData(currentPage - 1)}
                className="px-4 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ← Prev
              </button>
              <button
                disabled={currentPage >= lastPage}
                onClick={() => fetchData(currentPage + 1)}
                className="px-4 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
