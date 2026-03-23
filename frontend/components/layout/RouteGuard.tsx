'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface RouteGuardProps {
  children: ReactNode
  requiredRole?: 'admin' | 'client'
}

export default function RouteGuard({ children, requiredRole }: RouteGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (requiredRole && user?.role !== requiredRole) {
      if (user?.role === 'admin') {
        router.replace('/admin')
      } else {
        router.replace('/dashboard')
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) return null
  if (requiredRole && user?.role !== requiredRole) return null

  return <>{children}</>
}
