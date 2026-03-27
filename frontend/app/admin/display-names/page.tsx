'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DisplayNameRule {
  id: number
  client_id: number | null
  section: 'domain' | 'app'
  original_key: string
  display_name: string
  client: { id: number; name: string } | null
  updated_by: { id: number; name: string } | null
}

interface Client {
  id: number
  name: string
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

interface ModalProps {
  clients: Client[]
  onSave: (data: { client_id: number | null; section: 'domain' | 'app'; original_key: string; display_name: string }) => void
  onClose: () => void
  saving: boolean
}

function AddRuleModal({ clients, onSave, onClose, saving }: ModalProps) {
  const [section, setSection] = useState<'domain' | 'app'>('domain')
  const [originalKey, setOriginalKey] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [scope, setScope] = useState<'global' | 'client'>('global')
  const [clientId, setClientId] = useState<number | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!originalKey.trim() || !displayName.trim()) return
    onSave({
      client_id: scope === 'client' ? clientId : null,
      section,
      original_key: originalKey.trim(),
      display_name: displayName.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Add Rename Rule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Section</label>
            <div className="flex gap-3">
              {(['domain', 'app'] as const).map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="section"
                    value={s}
                    checked={section === s}
                    onChange={() => setSection(s)}
                    className="accent-green-700"
                  />
                  <span className="text-sm text-gray-700 capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Original name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Original Name <span className="text-gray-400 font-normal">(exact as it appears in CM360)</span>
            </label>
            <input
              type="text"
              value={originalKey}
              onChange={e => setOriginalKey(e.target.value)}
              placeholder={section === 'domain' ? 'e.g. muslimadnetwork.com' : 'e.g. Prayer Times'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700"
              required
            />
          </div>

          {/* Display name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="What to show instead"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700"
              required
            />
          </div>

          {/* Live preview */}
          {originalKey && displayName && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <span className="text-gray-500 font-mono">{originalKey}</span>
              <ArrowIcon />
              <span className="font-semibold text-gray-800">{displayName}</span>
            </div>
          )}

          {/* Scope */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Applies To</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="scope" value="global" checked={scope === 'global'} onChange={() => setScope('global')} className="accent-green-700" />
                <span className="text-sm text-gray-700">All Clients</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="scope" value="client" checked={scope === 'client'} onChange={() => setScope('client')} className="accent-green-700" />
                <span className="text-sm text-gray-700">Specific Client</span>
              </label>
            </div>
            {scope === 'client' && (
              <select
                value={clientId ?? ''}
                onChange={e => setClientId(e.target.value ? Number(e.target.value) : null)}
                className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700"
                required
              >
                <option value="">Select a client…</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
              style={{ backgroundColor: '#1a4a2e' }}
            >
              {saving ? 'Saving…' : 'Save Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DisplayNamesPage() {
  const { showToast, ToastContainer } = useToast()

  const [rules, setRules] = useState<DisplayNameRule[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterSection, setFilterSection] = useState<'' | 'domain' | 'app'>('')
  const [filterScope, setFilterScope] = useState<'' | 'global' | string>('') // '' = all, 'global' = null client_id, number string = client_id

  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchRules = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filterSection) params.section = filterSection
      if (filterScope === 'global') params.client_id = 'null'
      else if (filterScope) params.client_id = filterScope
      const { data } = await api.get<DisplayNameRule[]>('/api/admin/display-names', { params })
      setRules(data)
    } catch {
      showToast('Failed to load rules', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterSection, filterScope])

  useEffect(() => { fetchRules() }, [fetchRules])

  useEffect(() => {
    api.get<Client[]>('/api/admin/clients').then(({ data }) => setClients(data)).catch(() => {})
  }, [])

  const handleSave = async (formData: { client_id: number | null; section: 'domain' | 'app'; original_key: string; display_name: string }) => {
    setSaving(true)
    try {
      await api.post('/api/admin/display-names', formData)
      showToast('Rule saved', 'success')
      setShowModal(false)
      fetchRules()
    } catch {
      showToast('Failed to save rule', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/display-names/${id}`)
      showToast('Rule deleted', 'success')
      setDeleteId(null)
      fetchRules()
    } catch {
      showToast('Failed to delete rule', 'error')
    }
  }

  const sectionBadge = (section: string) => (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={section === 'domain'
        ? { backgroundColor: '#dbeafe', color: '#1e40af' }
        : { backgroundColor: '#f3e8ff', color: '#6b21a8' }
      }
    >
      {section}
    </span>
  )

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Display Names</h1>
          <p className="text-sm text-gray-500 mt-0.5">Rename domains and apps in client dashboards</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg"
          style={{ backgroundColor: '#1a4a2e' }}
        >
          <PlusIcon /> Add Rule
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterSection}
          onChange={e => setFilterSection(e.target.value as '' | 'domain' | 'app')}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700/20"
        >
          <option value="">All Sections</option>
          <option value="domain">Domain</option>
          <option value="app">App</option>
        </select>

        <select
          value={filterScope}
          onChange={e => setFilterScope(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700/20"
        >
          <option value="">All (Global + Client)</option>
          <option value="global">Global only</option>
          {clients.map(c => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Section</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Original Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Display Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Applies To</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Added By</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">Loading…</td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                    No rename rules yet. Add one to get started.
                  </td>
                </tr>
              ) : rules.map(rule => (
                <tr key={rule.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">{sectionBadge(rule.section)}</td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">{rule.original_key}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 text-xs">→</span>
                      <span className="font-semibold text-gray-800">{rule.display_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {rule.client ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                        {rule.client.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">All Clients</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{rule.updated_by?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    {deleteId === rule.id ? (
                      <span className="flex items-center justify-end gap-2">
                        <span className="text-xs text-gray-500">Delete?</span>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800"
                        >Yes</button>
                        <button
                          onClick={() => setDeleteId(null)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >No</button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setDeleteId(rule.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete rule"
                      >
                        <TrashIcon /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <AddRuleModal
          clients={clients}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          saving={saving}
        />
      )}
    </div>
  )
}
