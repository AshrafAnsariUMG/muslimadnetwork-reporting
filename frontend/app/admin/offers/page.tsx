'use client'

import { useEffect, useState, FormEvent } from 'react'
import api from '@/lib/api'
import OfferBanner from '@/components/dashboard/OfferBanner'
import { Offer } from '@/hooks/useOffers'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminOffer extends Offer {
  dismissals_count: number
  client: { id: number; name: string } | null
}

interface ClientOption {
  id: number
  name: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSchedule(offer: AdminOffer): { text: string; expired: boolean } {
  const now = new Date()
  if (!offer.starts_at && !offer.ends_at) return { text: 'Always', expired: false }
  const start = offer.starts_at ? new Date(offer.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null
  const end   = offer.ends_at   ? new Date(offer.ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null
  const expired = offer.ends_at ? new Date(offer.ends_at) < now : false
  const text = [start, end].filter(Boolean).join(' – ')
  return { text, expired }
}

const inputCls  = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100'
const labelCls  = 'block text-xs font-semibold text-[#64748b] mb-1.5'

const emptyForm = {
  title:     '',
  body:      '',
  cta_label: '',
  cta_url:   '',
  target:    'global' as 'global' | 'specific_client',
  client_id: '',
  is_active: true,
  starts_at: '',
  ends_at:   '',
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none"
      style={{ backgroundColor: checked ? '#10b981' : '#e2e8f0' }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OffersPage() {
  const [offers, setOffers]   = useState<AdminOffer[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm]       = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]     = useState('')

  const fetchOffers = () =>
    api.get<AdminOffer[]>('/api/admin/offers').then(({ data }) => setOffers(data))

  useEffect(() => {
    Promise.all([
      api.get<AdminOffer[]>('/api/admin/offers'),
      api.get<ClientOption[]>('/api/admin/clients'),
    ]).then(([o, c]) => {
      setOffers(o.data)
      setClients(c.data)
    }).finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (offer: AdminOffer) => {
    setEditingId(offer.id)
    setForm({
      title:     offer.title,
      body:      offer.body,
      cta_label: offer.cta_label,
      cta_url:   offer.cta_url,
      target:    offer.target,
      client_id: offer.client_id ? String(offer.client_id) : '',
      is_active: offer.is_active,
      starts_at: offer.starts_at ? offer.starts_at.slice(0, 10) : '',
      ends_at:   offer.ends_at   ? offer.ends_at.slice(0, 10)   : '',
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
        client_id: form.target === 'specific_client' && form.client_id ? Number(form.client_id) : null,
        starts_at: form.starts_at || null,
        ends_at:   form.ends_at   || null,
      }
      if (editingId) {
        await api.put(`/api/admin/offers/${editingId}`, payload)
      } else {
        await api.post('/api/admin/offers', payload)
      }
      setModalOpen(false)
      fetchOffers()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this offer?')) return
    await api.delete(`/api/admin/offers/${id}`)
    setOffers(prev => prev.filter(o => o.id !== id))
  }

  const handleToggle = async (offer: AdminOffer) => {
    const { data } = await api.post(`/api/admin/offers/${offer.id}/toggle`)
    setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, is_active: data.is_active } : o))
  }

  // Live preview offer from form values
  const previewOffer: Offer = {
    id: 0,
    title:     form.title     || 'Your offer title',
    body:      form.body      || 'Offer description goes here.',
    cta_label: form.cta_label || 'Learn More',
    cta_url:   form.cta_url   || '#',
    target:    form.target,
    client_id: form.client_id ? Number(form.client_id) : null,
    is_active: form.is_active,
    starts_at: form.starts_at || null,
    ends_at:   form.ends_at   || null,
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Offers &amp; Promotions</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Create targeted upsell offers for client dashboards</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2 text-sm font-semibold text-white rounded-full transition-colors"
          style={{ backgroundColor: '#1a4a2e' }}
        >
          + Create Offer
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl h-48 animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Target</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Schedule</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Dismissals</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer, i) => {
                const { text: scheduleText, expired } = formatSchedule(offer)
                return (
                  <tr
                    key={offer.id}
                    className="border-t border-gray-100 transition-colors duration-100"
                    style={{ backgroundColor: i % 2 === 1 ? '#f8fafc' : '#fff' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 1 ? '#f8fafc' : '#fff')}
                  >
                    {/* Title + body */}
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900">{offer.title}</p>
                      <p className="text-xs text-[#64748b] truncate max-w-xs mt-0.5">{offer.body}</p>
                    </td>

                    {/* Target */}
                    <td className="px-5 py-3">
                      {offer.target === 'global' ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                          All Clients
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                          {offer.client?.name ?? 'Specific'}
                        </span>
                      )}
                    </td>

                    {/* Status toggle */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <ToggleSwitch checked={offer.is_active} onChange={() => handleToggle(offer)} />
                        <span className="text-xs text-[#64748b]">{offer.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </td>

                    {/* Schedule */}
                    <td className="px-5 py-3">
                      <span className="text-xs" style={{ color: expired ? '#dc2626' : '#64748b' }}>
                        {scheduleText}{expired ? ' (expired)' : ''}
                      </span>
                    </td>

                    {/* Dismissals */}
                    <td className="px-5 py-3 text-xs text-[#64748b]">
                      {offer.dismissals_count} {offer.dismissals_count === 1 ? 'user' : 'users'}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(offer)} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>Edit</button>
                        <button onClick={() => handleDelete(offer.id)} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#fff5f5', color: '#dc2626' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {offers.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-[#64748b]">No offers yet. Create your first offer!</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{editingId ? 'Edit Offer' : 'Create Offer'}</h2>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 border-r border-gray-100">
                {error && (
                  <div className="px-4 py-3 text-sm text-white rounded-xl" style={{ backgroundColor: '#ef4444' }}>{error}</div>
                )}

                <div>
                  <label className={labelCls}>Title *</label>
                  <input required maxLength={100} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="e.g. Upgrade to Premium" />
                </div>

                <div>
                  <label className={labelCls}>Body * <span className="font-normal text-[#64748b]">({form.body.length}/500)</span></label>
                  <textarea
                    required maxLength={500} rows={3}
                    value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    className={inputCls}
                    placeholder="Short description of the offer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>CTA Label *</label>
                    <input required maxLength={50} value={form.cta_label} onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))} className={inputCls} placeholder="e.g. Learn More" />
                  </div>
                  <div>
                    <label className={labelCls}>CTA URL *</label>
                    <input required type="url" value={form.cta_url} onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))} className={inputCls} placeholder="https://..." />
                  </div>
                </div>

                {/* Target */}
                <div>
                  <label className={labelCls}>Target</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" name="target" value="global" checked={form.target === 'global'} onChange={() => setForm(f => ({ ...f, target: 'global', client_id: '' }))} />
                      All Clients
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" name="target" value="specific_client" checked={form.target === 'specific_client'} onChange={() => setForm(f => ({ ...f, target: 'specific_client' }))} />
                      Specific Client
                    </label>
                  </div>
                  {form.target === 'specific_client' && (
                    <select required value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className={`${inputCls} mt-2`}>
                      <option value="">Select client…</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Start Date <span className="font-normal">(optional)</span></label>
                    <input type="date" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>End Date <span className="font-normal">(optional)</span></label>
                    <input type="date" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} className={inputCls} />
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <ToggleSwitch checked={form.is_active} onChange={() => setForm(f => ({ ...f, is_active: !f.is_active }))} />
                  <span className="text-sm text-gray-700">Active (visible to clients)</span>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium border border-gray-200 text-[#64748b] rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-semibold text-white rounded-full disabled:opacity-60" style={{ backgroundColor: '#1a4a2e' }}>
                    {submitting ? 'Saving…' : editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>

              {/* Live preview */}
              <div className="px-6 py-5">
                <p className={labelCls}>Live Preview</p>
                <p className="text-xs text-[#64748b] mb-4">This is how the banner will appear to clients.</p>
                <OfferBanner offer={previewOffer} onDismiss={() => {}} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
