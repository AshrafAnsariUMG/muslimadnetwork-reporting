'use client'

import { useEffect, useState, FormEvent, useCallback } from 'react'
import api from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface ClientOption { id: number; name: string }
interface User {
  id: number
  name: string
  email: string
  role: string
  client_id: number | null
  client: { name: string } | null
}

interface PasswordModal {
  password: string
  label: string
  userId: number
  userEmail: string
}

const emptyForm = { name: '', email: '', role: 'client', client_id: '' }

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100'
const selectCls = inputCls

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [passwordModal, setPasswordModal] = useState<PasswordModal | null>(null)
  const [copied, setCopied] = useState(false)
  const [sendingOnboarding, setSendingOnboarding] = useState<number | null>(null)

  const { showToast, ToastContainer } = useToast()

  const fetchUsers = () =>
    api.get('/api/admin/users').then(({ data }) => setUsers(data))

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/users'),
      api.get('/api/admin/clients'),
    ]).then(([u, c]) => {
      setUsers(u.data)
      setClients(c.data)
    }).finally(() => setLoading(false))
  }, [])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (u: User) => {
    setEditingId(u.id)
    setForm({ name: u.name, email: u.email, role: u.role, client_id: u.client_id?.toString() ?? '' })
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
        client_id: form.role === 'client' && form.client_id ? Number(form.client_id) : null,
      }
      if (editingId) {
        const { data } = await api.put(`/api/admin/users/${editingId}`, payload)
        setUsers(prev => prev.map(u => u.id === editingId ? data : u))
        setModalOpen(false)
      } else {
        const { data } = await api.post('/api/admin/users', payload)
        setModalOpen(false)
        await fetchUsers()
        // Find the newly created user to get their email
        const newUser = data.user as User
        setPasswordModal({
          password: data.generated_password,
          label: 'New user created. Share this password — it will not be shown again.',
          userId: newUser.id,
          userEmail: newUser.email,
        })
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user?')) return
    await api.delete(`/api/admin/users/${id}`)
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  const handleResetPassword = async (u: User) => {
    if (!confirm('Reset this user\'s password?')) return
    const { data } = await api.post(`/api/admin/users/${u.id}/reset-password`)
    setPasswordModal({
      password: data.generated_password,
      label: 'Password reset. Share this password — it will not be shown again.',
      userId: u.id,
      userEmail: u.email,
    })
  }

  const handleSendOnboarding = useCallback(async (userId: number, userEmail: string) => {
    setSendingOnboarding(userId)
    try {
      await api.post(`/api/admin/users/${userId}/send-onboarding`)
      showToast(`Onboarding email sent to ${userEmail}`, 'success')
    } catch {
      showToast('Failed to send onboarding email', 'error')
    } finally {
      setSendingOnboarding(null)
    }
  }, [showToast])

  const copyPassword = () => {
    if (passwordModal) {
      navigator.clipboard.writeText(passwordModal.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div>
      <ToastContainer />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">Users</h1>
        <button
          onClick={openAdd}
          className="px-5 py-2 text-sm font-semibold text-white rounded-full transition-colors"
          style={{ backgroundColor: '#1a4a2e' }}
        >
          + Add User
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  className="border-t border-gray-100 transition-colors duration-100"
                  style={{ backgroundColor: i % 2 === 1 ? '#f8fafc' : '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 1 ? '#f8fafc' : '#fff')}
                >
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-[#64748b]">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-block px-3 py-0.5 text-xs font-semibold rounded-full capitalize"
                      style={u.role === 'admin'
                        ? { backgroundColor: '#ede9fe', color: '#7c3aed' }
                        : { backgroundColor: '#dbeafe', color: '#2563eb' }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#64748b]">{u.client?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => openEdit(u)} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>Edit</button>
                      <button onClick={() => handleResetPassword(u)} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>Reset PW</button>
                      {u.role === 'client' && (
                        <button
                          onClick={() => handleSendOnboarding(u.id, u.email)}
                          disabled={sendingOnboarding === u.id}
                          className="text-xs font-semibold px-3 py-1 rounded-full disabled:opacity-50"
                          style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
                        >
                          {sendingOnboarding === u.id ? 'Sending…' : 'Send Onboarding'}
                        </button>
                      )}
                      <button onClick={() => handleDelete(u.id)} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#fff5f5', color: '#dc2626' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-[#64748b]">No users yet.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-5">
              {editingId ? 'Edit User' : 'Add User'}
            </h2>

            {error && (
              <div className="mb-4 px-4 py-3 text-sm text-white rounded-xl" style={{ backgroundColor: '#ef4444' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Role *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value, client_id: '' }))}
                    className={selectCls}
                  >
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {form.role === 'client' && (
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
                )}
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

      {/* Password reveal modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#d1fae5' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Generated Password</h2>
            <p className="text-sm text-[#64748b] mb-4">{passwordModal.label}</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm text-gray-900 mb-5 select-all">
              {passwordModal.password}
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={copyPassword}
                className="px-4 py-2 text-sm font-semibold text-white rounded-full transition-colors"
                style={{ backgroundColor: '#1a4a2e' }}
              >
                {copied ? 'Copied!' : 'Copy Password'}
              </button>
              <button
                onClick={() => handleSendOnboarding(passwordModal.userId, passwordModal.userEmail)}
                disabled={sendingOnboarding === passwordModal.userId}
                className="px-4 py-2 text-sm font-semibold rounded-full disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
              >
                {sendingOnboarding === passwordModal.userId ? 'Sending…' : 'Send Onboarding Email'}
              </button>
              <button
                onClick={() => setPasswordModal(null)}
                className="px-4 py-2 text-sm font-medium border border-gray-200 text-[#64748b] rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
