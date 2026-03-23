'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import Footer from '@/components/layout/Footer'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
    } catch {
      // Swallow errors — always show success for security
    } finally {
      setSubmitting(false)
      setSubmitted(true)
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
            <p className="text-sm text-gray-500">Reset your password</p>
          </div>

          {submitted ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#d1fae5' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm text-gray-700 font-medium mb-1">Check your inbox</p>
              <p className="text-sm text-gray-500 mb-6">
                If an account exists with that email, you&apos;ll receive a reset link shortly.
              </p>
              <Link href="/login" className="text-sm font-medium" style={{ color: '#1a4a2e' }}>
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 px-4 py-3 text-sm text-white rounded-lg" style={{ backgroundColor: '#ef4444' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500 rounded-lg"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 text-sm font-medium text-white disabled:opacity-60 transition-opacity rounded-lg"
                  style={{ backgroundColor: '#1a4a2e' }}
                >
                  {submitting ? 'Sending…' : 'Send Reset Link'}
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
