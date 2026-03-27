'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface RouteGuardProps {
  children: ReactNode
  requiredRole?: 'admin' | 'client'
}

function LoadingScreen() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 88) { clearInterval(interval); return prev }
        const increment = prev < 40 ? 10 : prev < 65 ? 5 : prev < 80 ? 2 : 1
        return Math.min(prev + increment, 88)
      })
    }, 80)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ backgroundColor: '#f8f9fa' }}
    >
      {/* Brand */}
      <div className="mb-8 text-center">
        <div
          className="text-lg font-bold mb-1"
          style={{ color: '#1a4a2e', letterSpacing: '0.02em' }}
        >
          Muslim Ad Network
        </div>
        <div className="text-xs" style={{ color: '#C9A84C', letterSpacing: '0.08em' }}>
          REPORTING PORTAL
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-56">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 4, backgroundColor: '#e5e7eb' }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: '#1a4a2e',
              borderRadius: 9999,
              transition: 'width 80ms linear',
            }}
          />
        </div>
        <div
          className="text-right mt-2 text-xs font-medium tabular-nums"
          style={{ color: '#94a3b8' }}
        >
          {progress}%
        </div>
      </div>
    </div>
  )
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

  if (isLoading) return <LoadingScreen />

  if (!isAuthenticated) return null
  if (requiredRole && user?.role !== requiredRole) return null

  return <>{children}</>
}
