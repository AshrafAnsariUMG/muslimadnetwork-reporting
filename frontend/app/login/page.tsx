'use client'

import { useState, FormEvent, useEffect } from 'react'

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Footer from '@/components/layout/Footer'

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setSessionExpired(new URLSearchParams(window.location.search).get('expired') === '1')
  }, [])

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(user.role === 'admin' ? '/admin' : '/dashboard')
    }
  }, [isAuthenticated, isLoading, user, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      // redirect handled by useEffect above
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUmmahPass = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/ummahpass/redirect`
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white shadow-sm border border-gray-200 p-10">
          {/* Logo / Brand */}
          <div className="mb-8 text-center">
            <img
              src="/logo.jpeg"
              alt="Muslim Ad Network"
              style={{ width: 80, height: 80, borderRadius: 16, display: 'block', margin: '0 auto 24px' }}
            />
            <p className="text-sm text-gray-500">Client Reporting Portal</p>
          </div>

          {/* Session expired banner */}
          {sessionExpired && !error && (
            <div
              className="mb-6 px-4 py-3 text-sm text-white"
              style={{ backgroundColor: '#f59e0b' }}
            >
              Your session has expired. Please sign in again.
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="mb-6 px-4 py-3 text-sm text-white"
              style={{ backgroundColor: '#e8192c' }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-gray-700">
                  Forgot your password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-sm font-medium text-white disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: '#1a4a2e' }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* UmmahPass */}
          <button
            type="button"
            onClick={handleUmmahPass}
            className="w-full py-2.5 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Login with UmmahPass
          </button>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  )
}
