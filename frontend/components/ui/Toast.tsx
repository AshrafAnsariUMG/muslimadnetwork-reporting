'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const fadeIn = setTimeout(() => setVisible(true), 10)
    const dismiss = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 250)
    }, 2000)
    return () => {
      clearTimeout(fadeIn)
      clearTimeout(dismiss)
    }
  }, [onDismiss])

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg"
      style={{
        backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 200ms ease, transform 200ms ease',
        maxWidth: 320,
      }}
    >
      {type === 'success' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {message}
    </div>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface ToastState {
  id: number
  message: string
  type: 'success' | 'error'
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([])
  const counterRef = useRef(0)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++counterRef.current + Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const ToastContainer = useCallback(() => (
    <>
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => dismiss(t.id)} />
      ))}
    </>
  ), [toasts, dismiss])

  return { showToast, ToastContainer }
}
