'use client'

import { useEffect, useState, FormEvent } from 'react'
import api from '@/lib/api'

interface ClientOption { id: number; name: string }
interface Campaign {
  id: number
  name: string
  cm360_campaign_id: string
  status: string
  start_date: string
  end_date: string
  contracted_impressions: number | null
  contracted_clicks: number | null
  is_primary: boolean
  has_conversion_tracking: boolean
  cm360_activity_id: string | null
  client_id: number
  client: { name: string } | null
}

const emptyForm = {
  client_id: '',
  name: '',
  cm360_campaign_id: '',
  status: 'active',
  start_date: '',
  end_date: '',
  contracted_impressions: '',
  contracted_clicks: '',
  is_primary: true,
  has_conversion_tracking: false,
  cm360_activity_id: '',
}

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  active:   { bg: '#d1fae5', text: '#065f46' },
  paused:   { bg: '#fef3c7', text: '#92400e' },
  ended:    { bg: '#f1f5f9', text: '#64748b' },
  upcoming: { bg: '#dbeafe', text: '#1e40af' },
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100'
const selectCls = inputCls

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [filterClientId, setFilterClientId] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchCampaigns = (clientId?: string) => {
    const params = clientId ? `?client_id=${clientId}` : ''
    return api.get(`/api/admin/campaigns${params}`).then(({ data }) => setCampaigns(data))
  }

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/campaigns'),
      api.get('/api/admin/clients'),
    ]).then(([c, cl]) => {
      setCampaigns(c.data)
      setClients(cl.data)
    }).finally(() => setLoading(false))
  }, [])

  const handleFilterChange = (clientId: string) => {
    setFilterClientId(clientId)
    setLoading(true)
    fetchCampaigns(clientId || undefined).finally(() => setLoading(false))
  }

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...emptyForm, client_id: filterClientId })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (c: Campaign) => {
    setEditingId(c.id)
    setForm({
      client_id: c.client_id.toString(),
      name: c.name,
      cm360_campaign_id: c.cm360_campaign_id,
      status: c.status,
      start_date: c.start_date,
      end_date: c.end_date,
      contracted_impressions: c.contracted_impressions?.toString() ?? '',
      contracted_clicks: c.contracted_clicks?.toString() ?? '',
      is_primary: c.is_primary,
      has_conversion_tracking: c.has_conversion_tracking,
      cm360_activity_id: c.cm360_activity_id ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        ...form,
        client_id: Number(form.client_id),
        contracted_impressions: form.contracted_impressions ? Number(form.contracted_impressions) : null,
        contracted_clicks: form.contracted_clicks ? Number(form.contracted_clicks) : null,
        cm360_activity_id: form.has_conversion_tracking ? (form.cm360_activity_id || null) : null,
      }
      if (editingId) {
        await api.put(`/api/admin/campaigns/${editingId}`, payload)
      } else {
        await api.post('/api/admin/campaigns', payload)
      }
      setModalOpen(false)
      fetchCampaigns(filterClientId || undefined)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this campaign?')) return
    await api.delete(`/api/admin/campaigns/${id}`)
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">Campaigns</h1>
          <select
            value={filterClientId}
            onChange={e => handleFilterChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={openAdd}
          className="px-5 py-2 text-sm font-semibold text-white rounded-full transition-colors"
          style={{ backgroundColor: '#1a4a2e' }}
        >
          + Add Campaign
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl h-48 animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Campaign Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">CM360 ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Dates</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => {
                const badge = STATUS_BADGE[c.status] ?? { bg: '#f1f5f9', text: '#64748b' }
                return (
                  <tr
                    key={c.id}
                    className="border-t border-gray-100 transition-colors duration-100"
                    style={{ backgroundColor: i % 2 === 1 ? '#f8fafc' : '#fff' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 1 ? '#f8fafc' : '#fff')}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{c.name}</div>
                      {c.is_primary && <div className="text-xs text-[#64748b] mt-0.5">Primary</div>}
                    </td>
                    <td className="px-5 py-3 text-[#64748b]">{c.client?.name ?? '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#64748b]">{c.cm360_campaign_id}</td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-block px-3 py-0.5 text-xs font-semibold rounded-full capitalize"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#64748b] text-xs">
                      <div>{c.start_date}</div>
                      <div>{c.end_date}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>Edit</button>
                        <button onClick={() => handleDelete(c.id)} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#fff5f5', color: '#dc2626' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {campaigns.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-[#64748b]">No campaigns found.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-gray-900 mb-5">
              {editingId ? 'Edit Campaign' : 'Add Campaign'}
            </h2>

            {error && (
              <div className="mb-4 px-4 py-3 text-sm text-white rounded-xl" style={{ backgroundColor: '#ef4444' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Client *</label>
                <select
                  required
                  value={form.client_id}
                  onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                  className={selectCls}
                >
                  <option value="">Select a client…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Campaign Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5">CM360 Campaign ID *</label>
                <input
                  required
                  value={form.cm360_campaign_id}
                  onChange={e => setForm(f => ({ ...f, cm360_campaign_id: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Status *</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className={selectCls}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="ended">Ended</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">End Date *</label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Contracted Impressions</label>
                  <input
                    type="number"
                    min="0"
                    value={form.contracted_impressions}
                    onChange={e => setForm(f => ({ ...f, contracted_impressions: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Contracted Clicks</label>
                  <input
                    type="number"
                    min="0"
                    value={form.contracted_clicks}
                    onChange={e => setForm(f => ({ ...f, contracted_clicks: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={form.is_primary}
                  onChange={e => setForm(f => ({ ...f, is_primary: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
                <label htmlFor="is_primary" className="text-xs font-semibold text-[#64748b]">Primary campaign</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="has_conversion_tracking"
                  checked={form.has_conversion_tracking}
                  onChange={e => setForm(f => ({ ...f, has_conversion_tracking: e.target.checked, cm360_activity_id: e.target.checked ? f.cm360_activity_id : '' }))}
                  className="h-4 w-4 rounded"
                />
                <label htmlFor="has_conversion_tracking" className="text-xs font-semibold text-[#64748b]">Has Conversion Tracking</label>
              </div>
              {form.has_conversion_tracking && (
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">CM360 Activity ID *</label>
                  <input
                    required
                    value={form.cm360_activity_id}
                    onChange={e => setForm(f => ({ ...f, cm360_activity_id: e.target.value }))}
                    className={inputCls}
                    placeholder="e.g. 12345678"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium border border-gray-200 text-[#64748b] rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-semibold text-white rounded-full disabled:opacity-60 transition-colors" style={{ backgroundColor: '#1a4a2e' }}>
                  {submitting ? 'Saving…' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
