'use client'

import { useEffect, useState, FormEvent } from 'react'
import api from '@/lib/api'

interface Client {
  id: number
  name: string
  client_type: string
  is_active: boolean
  intelligent_offers_enabled: boolean
  primary_color: string | null
  notes: string | null
  users_count: number
  campaigns_count: number
}

const emptyForm = {
  name: '',
  client_type: 'standard',
  primary_color: '#1a4a2e',
  notes: '',
  intelligent_offers_enabled: false,
}

// ─── Shared input/select styles ───────────────────────────────────────────────

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100'
const selectCls = inputCls

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchClients = () => {
    api.get('/api/admin/clients')
      .then(({ data }) => setClients(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchClients() }, [])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (c: Client) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      client_type: c.client_type,
      primary_color: c.primary_color ?? '#1a4a2e',
      notes: c.notes ?? '',
      intelligent_offers_enabled: c.intelligent_offers_enabled ?? false,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (editingId) {
        await api.put(`/api/admin/clients/${editingId}`, form)
      } else {
        await api.post('/api/admin/clients', form)
      }
      setModalOpen(false)
      fetchClients()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this client?')) return
    await api.delete(`/api/admin/clients/${id}`)
    fetchClients()
  }

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">Clients</h1>
        <button
          onClick={openAdd}
          className="px-5 py-2 text-sm font-semibold text-white rounded-full transition-colors"
          style={{ backgroundColor: '#1a4a2e' }}
        >
          + Add Client
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Campaigns</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Users</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-t border-gray-100 transition-colors duration-100"
                  style={{ backgroundColor: i % 2 === 1 ? '#f8fafc' : '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 1 ? '#f8fafc' : '#fff')}
                >
                  <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3 text-[#64748b] capitalize">{c.client_type.replace('_', ' ')}</td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-block px-3 py-0.5 text-xs font-semibold rounded-full"
                      style={c.is_active
                        ? { backgroundColor: '#d1fae5', color: '#065f46' }
                        : { backgroundColor: '#f1f5f9', color: '#64748b' }}
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#64748b]">{c.campaigns_count}</td>
                  <td className="px-5 py-3 text-[#64748b]">{c.users_count}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>Edit</button>
                      <button onClick={() => handleImpersonate(c.id)} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#faf5ff', color: '#7c3aed' }}>Impersonate</button>
                      {c.is_active && (
                        <button onClick={() => handleDeactivate(c.id)} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#fff5f5', color: '#dc2626' }}>Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-[#64748b]">No clients yet.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-5">
              {editingId ? 'Edit Client' : 'Add Client'}
            </h2>

            {error && (
              <div className="mb-4 px-4 py-3 text-sm text-white rounded-xl" style={{ backgroundColor: '#ef4444' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Client Type *</label>
                  <select value={form.client_type} onChange={e => setForm(f => ({ ...f, client_type: e.target.value }))} className={selectCls}>
                    <option value="standard">Standard</option>
                    <option value="conversion">Conversion</option>
                    <option value="multi_campaign">Multi Campaign</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))} className="h-9 w-12 border border-gray-200 rounded-lg p-0.5 cursor-pointer" />
                    <span className="text-xs text-[#64748b]">{form.primary_color}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls + ' resize-none'} />
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.intelligent_offers_enabled}
                  onClick={() => setForm(f => ({ ...f, intelligent_offers_enabled: !f.intelligent_offers_enabled }))}
                  className="flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200 mt-0.5"
                  style={{ backgroundColor: form.intelligent_offers_enabled ? '#1a4a2e' : '#e2e8f0' }}
                >
                  <div
                    className="w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: form.intelligent_offers_enabled ? 'translateX(22px)' : 'translateX(2px)', marginTop: '2px' }}
                  />
                </button>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Intelligent Offers</p>
                  <p className="text-xs text-[#64748b] mt-0.5">Automatically show performance-triggered upsell offers in this client&apos;s dashboard</p>
                </div>
              </div>

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
