'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import api from '@/lib/api'
import { formatNumber } from '@/lib/dateUtils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: number
  action: string
  created_at: string
  admin_user: { id: number; name: string } | null
  impersonating_client: { id: number; name: string } | null
}

interface TopClient {
  id: number
  name: string
  client_type: string
  campaigns_count: number
  users_count: number
}

interface AdminClient {
  id: number
  name: string
  client_type: string
  is_active: boolean
  users_count: number
  campaigns_count: number
}

interface Stats {
  total_clients: number
  total_users: number
  total_campaigns: number
  campaigns_by_status: Record<string, number>
  top_clients: TopClient[]
  recent_activity: AuditEntry[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CHART_COLORS: Record<string, string> = {
  active:   '#10b981',
  paused:   '#f59e0b',
  ended:    '#64748b',
  upcoming: '#2563eb',
}

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  active:   { bg: '#d1fae5', text: '#065f46' },
  paused:   { bg: '#fef3c7', text: '#92400e' },
  ended:    { bg: '#f1f5f9', text: '#64748b' },
  upcoming: { bg: '#dbeafe', text: '#1e40af' },
}

const CLIENT_TYPE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  standard:       { bg: '#f1f5f9', text: '#475569', label: 'Standard' },
  conversion:     { bg: '#ede9fe', text: '#7c3aed', label: 'Conversion' },
  multi_campaign: { bg: '#dbeafe', text: '#1e40af', label: 'Multi-Campaign' },
}

const ACTION_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  impersonation_started: { border: '#2563eb', bg: '#eff6ff', text: '#1e40af' },
  impersonation_stopped: { border: '#2563eb', bg: '#eff6ff', text: '#1e40af' },
  onboarding_email_sent: { border: '#10b981', bg: '#f0fdf4', text: '#065f46' },
  password_reset:        { border: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
}

function getActionStyle(action: string) {
  return ACTION_STYLES[action] ?? { border: '#e2e8f0', bg: '#f8fafc', text: '#64748b' }
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

// ─── Icons ────────────────────────────────────────────────────────────────────

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const PersonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, iconBg }: { label: string; value: number | string; icon: React.ReactNode; iconBg: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}

// ─── Doughnut tooltip ─────────────────────────────────────────────────────────

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percent: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-xl px-3 py-2 text-sm shadow-lg" style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
      <p className="font-semibold capitalize">{d.name}</p>
      <p className="text-xs text-slate-300">{formatNumber(d.value)} campaigns ({d.payload.percent.toFixed(1)}%)</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [clients, setClients] = useState<AdminClient[]>([])
  const [loading, setLoading] = useState(true)

  const handleImpersonate = async (clientId: number) => {
    try {
      const { data } = await api.post(`/api/admin/impersonate/${clientId}`)
      const adminToken = localStorage.getItem('auth_token') ?? ''
      localStorage.setItem('admin_token', adminToken)
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('impersonation_token', data.token)
      window.open('/dashboard', '_blank')
    } catch {
      alert('Could not impersonate: no active user found for this client.')
    }
  }

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/stats'),
      api.get('/api/admin/clients'),
    ]).then(([statsRes, clientsRes]) => {
      setStats(statsRes.data)
      setClients(clientsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl h-64 animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
          <div className="bg-white rounded-2xl h-64 animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
        </div>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-sm text-red-500">Failed to load dashboard data.</div>
  }

  const activeCount = stats.campaigns_by_status?.active ?? 0
  const totalCampaignsForChart = Object.values(stats.campaigns_by_status ?? {}).reduce((a, b) => a + b, 0)

  const chartData = Object.entries(stats.campaigns_by_status ?? {})
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: status,
      value: count,
      color: STATUS_CHART_COLORS[status] ?? '#e2e8f0',
      percent: totalCampaignsForChart > 0 ? (count / totalCampaignsForChart) * 100 : 0,
    }))

  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <StatCard label="Active Clients"    value={stats.total_clients}    icon={<UsersIcon />}    iconBg="#dbeafe" />
        <StatCard label="Total Users"       value={stats.total_users}       icon={<PersonIcon />}   iconBg="#d1fae5" />
        <StatCard label="Total Campaigns"   value={stats.total_campaigns}   icon={<BarChartIcon />} iconBg="#ede9fe" />
        <StatCard label="Active Campaigns"  value={activeCount}             icon={<ActivityIcon />} iconBg="#fef3c7" />
      </div>

      {/* ── Second row: chart + recent activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Campaign status doughnut */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h2 className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-4">Campaign Status Overview</h2>
          {chartData.length === 0 ? (
            <div className="text-sm text-[#64748b] text-center py-8">No campaigns yet.</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-shrink-0" style={{ width: 200, height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={95}
                      animationBegin={0}
                      animationDuration={700}
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-gray-900">{formatNumber(totalCampaignsForChart)}</span>
                  <span className="text-xs text-[#64748b]">Total</span>
                </div>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {chartData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm text-gray-700 capitalize">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{entry.value}</span>
                      <span className="text-xs text-[#64748b]">({entry.percent.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Recent Activity</h2>
            <Link href="/admin/audit-log" className="text-xs font-semibold" style={{ color: '#2563eb' }}>
              View Full Log →
            </Link>
          </div>
          {stats.recent_activity.length === 0 ? (
            <div className="text-sm text-[#64748b] text-center py-8">No activity yet.</div>
          ) : (
            <div className="space-y-2">
              {stats.recent_activity.map((entry) => {
                const style = getActionStyle(entry.action)
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                    style={{ borderLeft: `3px solid ${style.border}`, backgroundColor: style.bg }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-900 truncate">
                          {entry.admin_user?.name ?? 'Admin'}
                        </span>
                        <span className="text-xs text-[#64748b] flex-shrink-0">
                          {relativeTime(entry.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{humanAction(entry)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Clients overview table ── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Clients Overview</h2>
        </div>
        {clients.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-[#64748b]">No clients yet.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Campaigns</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Users</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => {
                const typeBadge = CLIENT_TYPE_BADGE[client.client_type] ?? CLIENT_TYPE_BADGE.standard
                const statusBadge = client.is_active ? STATUS_BADGE.active : { bg: '#f1f5f9', text: '#64748b' }
                return (
                  <tr
                    key={client.id}
                    className="border-t border-gray-50 transition-colors duration-100"
                    style={{ backgroundColor: i % 2 === 1 ? '#f8fafc' : '#fff' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 1 ? '#f8fafc' : '#fff')}
                  >
                    <td className="px-6 py-3 font-semibold text-gray-900">{client.name}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: typeBadge.bg, color: typeBadge.text }}>
                        {typeBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}>
                        {client.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-[#64748b] tabular-nums">{client.campaigns_count}</td>
                    <td className="px-6 py-3 text-[#64748b] tabular-nums">{client.users_count}</td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleImpersonate(client.id)}
                          className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
                        >
                          Impersonate
                        </button>
                        <Link
                          href="/admin/clients"
                          className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{ backgroundColor: '#f8fafc', color: '#64748b' }}
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}
