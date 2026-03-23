'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import RouteGuard from '@/components/layout/RouteGuard'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import Footer from '@/components/layout/Footer'

function ProfileContent() {
  const { user } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')

  const backHref = user?.role === 'admin' ? '/admin' : '/dashboard'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setFieldError('New passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await api.put('/api/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      })
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { errors?: { current_password?: string[] }; message?: string } } }
      const currentPwErr = e?.response?.data?.errors?.current_password?.[0]
      if (currentPwErr) {
        setFieldError(currentPwErr)
      } else {
        setError(e?.response?.data?.message ?? 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
          <div className="mb-6">
            <h1 className="text-lg font-bold text-gray-900">Change Password</h1>
            <p className="text-sm text-[#64748b] mt-0.5">{user?.name} · {user?.email}</p>
          </div>

          {success && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
              Password changed successfully.
            </div>
          )}

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className={inputCls}
                placeholder="••••••••"
              />
              {fieldError && (
                <p className="mt-1 text-xs" style={{ color: '#dc2626' }}>{fieldError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={inputCls}
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={inputCls}
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: '#2563eb' }}
              >
                {submitting ? 'Saving…' : 'Update password'}
              </button>
              <Link
                href={backHref}
                className="px-4 py-2.5 text-sm font-medium text-[#64748b] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </Link>
            </div>
          </form>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <RouteGuard>
      <ProfileContent />
    </RouteGuard>
  )
}
