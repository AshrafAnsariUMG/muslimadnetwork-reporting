'use client'

import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

function letterGradient(name: string): string {
  const c = (name || 'A')[0].toUpperCase()
  if (c <= 'E') return 'linear-gradient(135deg, #2563eb, #1d4ed8)'
  if (c <= 'J') return 'linear-gradient(135deg, #10b981, #059669)'
  if (c <= 'O') return 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
  if (c <= 'T') return 'linear-gradient(135deg, #f59e0b, #d97706)'
  return 'linear-gradient(135deg, #ef4444, #dc2626)'
}

interface Props {
  appId: string | null
  appName: string
  size?: number
}

export default function AppIcon({ appId, appName, size = 32 }: Props) {
  const hasBundleId = appId && appId.includes('.')
  const [iconUrl, setIconUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!hasBundleId) return
    const token = localStorage.getItem('auth_token')
    if (!token) return

    fetch(`${API_URL}/api/app-icon?bundle_id=${encodeURIComponent(appId!)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.icon_url) setIconUrl(data.icon_url)
      })
      .catch(() => {})
  }, [appId, hasBundleId])

  const letter = (appName || '?')[0].toUpperCase()
  const radius = Math.round(size / 4)

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        width={size}
        height={size}
        alt=""
        style={{ borderRadius: radius, objectFit: 'contain', display: 'block' }}
        onError={() => setIconUrl(null)}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: letterGradient(appName),
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: 14,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  )
}
