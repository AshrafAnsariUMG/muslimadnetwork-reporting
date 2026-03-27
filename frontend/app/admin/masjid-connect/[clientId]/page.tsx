'use client'

import { useEffect, useRef, useState, FormEvent } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import api from '@/lib/api'

interface MasjidRecord {
  id: number
  masjid_name: string
  city: string
  country: string
  screen_photo_url: string
  sort_order: number
  is_active: boolean
}

const MosqueIcon = ({ size = 40, color = '#C9A84C' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C9 2 7 4 7 6c0 1.5.8 2.8 2 3.5V11H5l-2 2h18l-2-2h-4V9.5c1.2-.7 2-2 2-3.5 0-2-2-4-5-4z" />
    <rect x="3" y="13" width="18" height="9" rx="1" />
    <line x1="12" y1="13" x2="12" y2="22" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100'

export default function MasjidConnectClientPage() {
  const params = useParams()
  const clientId = params.clientId as string

  const [masjids, setMasjids] = useState<MasjidRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('United States')
  const [sortOrder, setSortOrder] = useState('0')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMasjids = () => {
    return api.get(`/api/admin/masjid-connect/${clientId}`)
      .then(({ data }) => setMasjids(data))
  }

  useEffect(() => {
    Promise.all([
      api.get(`/api/admin/masjid-connect/${clientId}`),
      api.get('/api/admin/clients'),
    ]).then(([mRes, cRes]) => {
      setMasjids(mRes.data)
      const found = cRes.data.find((c: { id: number; name: string }) => String(c.id) === clientId)
      setClientName(found?.name ?? '')
    }).finally(() => setLoading(false))
  }, [clientId])

  const openAdd = () => {
    setEditingId(null)
    setName(''); setCity(''); setCountry('United States'); setSortOrder('0')
    setPhotoFile(null); setCurrentPhotoUrl('')
    setError('')
    setModalOpen(true)
  }

  const openEdit = (m: MasjidRecord) => {
    setEditingId(m.id)
    setName(m.masjid_name); setCity(m.city); setCountry(m.country); setSortOrder(String(m.sort_order))
    setPhotoFile(null); setCurrentPhotoUrl(m.screen_photo_url)
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingId && !photoFile) { setError('Screen photo is required.'); return }
    setSubmitting(true); setError('')
    try {
      const fd = new FormData()
      fd.append('masjid_name', name)
      fd.append('city', city)
      fd.append('country', country)
      fd.append('sort_order', sortOrder)
      if (photoFile) fd.append('screen_photo', photoFile)

      if (editingId) {
        fd.append('_method', 'PUT')
        await api.post(`/api/admin/masjid-connect/${clientId}/${editingId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post(`/api/admin/masjid-connect/${clientId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      setModalOpen(false)
      await fetchMasjids()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this masjid entry?')) return
    await api.delete(`/api/admin/masjid-connect/${clientId}/${id}`)
    setMasjids(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/masjid-connect" className="text-xs text-[#64748b] hover:text-gray-700 flex items-center gap-1 mb-1">
            ← MasjidConnect
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            MasjidConnect — {clientName || '…'}
          </h1>
        </div>
        <button
          onClick={openAdd}
          className="px-5 py-2 text-sm font-semibold text-white rounded-full"
          style={{ backgroundColor: '#1a4a2e' }}
        >
          + Add Masjid
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ height: 200, backgroundColor: '#e5e7eb' }} />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : masjids.length === 0 ? (
        <div
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-20"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <div className="mb-4 opacity-30"><MosqueIcon size={56} /></div>
          <p className="text-sm font-medium text-[#64748b]">No masjids added yet</p>
          <p className="text-xs text-[#94a3b8] mt-1">Click &ldquo;+ Add Masjid&rdquo; to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {masjids.map(m => (
            <div
              key={m.id}
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}
            >
              <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                <img src={m.screen_photo_url} alt={m.masjid_name} className="w-full h-full object-cover" />
                <span
                  className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                >
                  #{m.sort_order}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{m.masjid_name}</p>
                    <p className="text-xs text-[#64748b] mt-0.5">{m.city}, {m.country}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(m)}
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: '#fff5f5', color: '#dc2626' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-gray-900 mb-5">
              {editingId ? 'Edit Masjid' : 'Add Masjid'}
            </h2>

            {error && (
              <div className="mb-4 px-4 py-3 text-sm text-white rounded-xl" style={{ backgroundColor: '#ef4444' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Masjid Name *</label>
                <input required value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Masjid Al-Noor" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">City *</label>
                  <input required value={city} onChange={e => setCity(e.target.value)} className={inputCls} placeholder="e.g. Chicago" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Country</label>
                  <input value={country} onChange={e => setCountry(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Sort Order</label>
                <input type="number" min="0" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                  Screen Photo {editingId ? '(leave blank to keep current)' : '*'}
                </label>
                {currentPhotoUrl && !photoFile && (
                  <div className="mb-2 rounded-lg overflow-hidden" style={{ height: 120 }}>
                    <img src={currentPhotoUrl} alt="Current" className="w-full h-full object-cover" />
                  </div>
                )}
                {photoFile && (
                  <div className="mb-2 rounded-lg overflow-hidden" style={{ height: 120 }}>
                    <img src={URL.createObjectURL(photoFile)} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-[#64748b] file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium border border-gray-200 text-[#64748b] rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-semibold text-white rounded-full disabled:opacity-60" style={{ backgroundColor: '#1a4a2e' }}>
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
