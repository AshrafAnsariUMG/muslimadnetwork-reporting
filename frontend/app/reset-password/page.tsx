'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import Footer from '@/components/layout/Footer'

function getStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: '', color: '#e5e7eb', width: '0%' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '33%' }
  if (score === 2 || score === 3) return { label: 'Medium', color: '#f59e0b', width: '66%' }
  return { label: 'Strong', color: '#10b981', width: '100%' }
}

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const strength = getStrength(password)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/api/auth/reset-password', {
        email,
        token,
        password,
        password_confirmation: confirmation,
      })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-sm border border-gray-200 p-10">
          {/* Brand */}
          <div className="mb-8 text-center">
            <img
              src="/logo.jpeg"
              alt="Muslim Ad Network"
              style={{ width: 80, height: 80, borderRadius: 16, display: 'block', margin: '0 auto 24px' }}
            />
            <p className="text-sm text-gray-500">Set a new password</p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#d1fae5' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm text-gray-700 font-medium mb-1">Password reset successfully!</p>
              <p className="text-sm text-gray-500">Redirecting you to login…</p>
            </div>
          ) : (
            <>
              {!token && (
                <div className="mb-5 px-4 py-3 text-sm text-white rounded-lg" style={{ backgroundColor: '#ef4444' }}>
                  Invalid reset link. Please request a new one.
                </div>
              )}

              {error && (
                <div className="mb-5 px-4 py-3 text-sm text-white rounded-lg" style={{ backgroundColor: '#ef4444' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500 rounded-lg"
                    placeholder="Min. 8 characters"
                  />
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: strength.width, backgroundColor: strength.color }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: strength.color }}>{strength.label}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmation}
                    onChange={e => setConfirmation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500 rounded-lg"
                    placeholder="Repeat password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !token}
                  className="w-full py-2.5 text-sm font-medium text-white disabled:opacity-60 transition-opacity rounded-lg"
                  style={{ backgroundColor: '#1a4a2e' }}
                >
                  {submitting ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
                  ← Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
      <Footer />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
