'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export interface Client {
  id: number
  name: string
  logo_url: string | null
  primary_color: string | null
  cm360_advertiser_id: string
  cm360_profile_id: string
  client_type: string
  is_active: boolean
  features: Record<string, unknown> | null
}

export interface User {
  id: number
  name: string
  email: string
  role: string
  client_id: number | null
  client: Client | null
  last_visited_at?: string | null
}

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isImpersonating: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  stopImpersonation: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    const impersonating = typeof window !== 'undefined'
      ? !!localStorage.getItem('impersonation_token')
      : false

    setIsImpersonating(impersonating)

    if (stored) {
      setToken(stored)
      fetchUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/api/auth/me')
      setUser(data)
    } catch {
      setUser(null)
      if (typeof window !== 'undefined') localStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    const newToken: string = data.token
    localStorage.setItem('auth_token', newToken)
    setToken(newToken)
    setUser(data.user)
  }

  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('admin_token')
      localStorage.removeItem('impersonation_token')
      setToken(null)
      setUser(null)
      setIsImpersonating(false)
    }
  }

  const stopImpersonation = async () => {
    try {
      await api.post('/api/admin/impersonate/stop')
    } catch {
      // continue regardless
    } finally {
      const adminToken = localStorage.getItem('admin_token')
      if (adminToken) {
        localStorage.setItem('auth_token', adminToken)
        localStorage.removeItem('admin_token')
      }
      localStorage.removeItem('impersonation_token')
      setIsImpersonating(false)
      setToken(adminToken)
      await fetchUser()
      router.replace('/admin/clients')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isImpersonating,
        login,
        logout,
        fetchUser,
        stopImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
