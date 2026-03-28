'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MasjidConnectData, MasjidEntry } from '@/types/reports'
import { MosqueIcon } from '@/components/ui/IslamicIcons'
import { Skeleton } from '@/components/ui/Skeleton'

const ChevronLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  masjids,
  initialIndex,
  onClose,
}: {
  masjids: MasjidEntry[]
  initialIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const current = masjids[index]

  const prev = useCallback(() => setIndex(i => (i - 1 + masjids.length) % masjids.length), [masjids.length])
  const next = useCallback(() => setIndex(i => (i + 1) % masjids.length), [masjids.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full"
        style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
      >
        <CloseIcon />
      </button>

      {/* Content */}
      <div
        className="relative max-w-2xl w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={current.screen_photo_url}
          alt={current.masjid_name}
          className="w-full rounded-xl object-contain"
          style={{ maxHeight: '70vh' }}
        />
        <div className="mt-4 text-center">
          <p className="text-white font-bold text-lg">{current.masjid_name}</p>
          <p className="text-white/60 text-sm mt-1">{current.city}, {current.country}</p>
        </div>

        {/* Counter */}
        <div className="absolute top-3 left-3 text-white/70 text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          {index + 1} / {masjids.length}
        </div>
      </div>

      {/* Nav arrows — only show when multiple */}
      {masjids.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <ChevronRightIcon />
          </button>
        </>
      )}
    </div>,
    document.body,
  )
}

// ─── Masjid card ─────────────────────────────────────────────────────────────

function MasjidCard({ masjid, onClick }: { masjid: MasjidEntry; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        border: hovered ? '1px solid #C9A84C' : '1px solid #e5e7eb',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
      }}
    >
      <div style={{ height: 180, overflow: 'hidden' }}>
        <img
          src={masjid.screen_photo_url}
          alt={masjid.masjid_name}
          className="w-full h-full object-cover"
          style={{ transition: 'transform 300ms ease', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
        />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <MosqueIcon size={14} color="#C9A84C" />
          <span className="font-semibold text-gray-900 text-sm truncate">{masjid.masjid_name}</span>
        </div>
        <p className="text-xs text-[#64748b]">{masjid.city}, {masjid.country}</p>
      </div>
    </div>
  )
}

// ─── Marketing fallback ───────────────────────────────────────────────────────

function MarketingFallback() {
  return (
    <div
      className="w-full rounded-2xl text-center"
      style={{
        background: 'linear-gradient(135deg, #1a4a2e, #2d7a4a)',
        padding: '48px 32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      }}
    >
      <div className="flex justify-center mb-6">
        <MosqueIcon size={64} color="#C9A84C" />
      </div>

      <h2 className="text-white font-bold text-2xl mb-4" style={{ letterSpacing: '-0.01em' }}>
        Your Brand. Inside the Masjid.
      </h2>

      <p className="text-white/80 text-sm leading-relaxed max-w-lg mx-auto mb-8">
        MasjidConnect places your ads on digital screens inside mosques across North America.
        Reach Muslims in their most trusted spaces — during Jumu&apos;ah, Taraweeh, and daily prayers.
        Thousands of engaged eyes. Zero ad blockers. Pure barakah in your marketing.
      </p>

      <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
        <a
          href="https://muslimadnetwork.pipedrive.com/scheduler/9KmA9sa/muslim-ad-network-advertising-partnership-next-steps"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-2.5 text-sm font-semibold rounded-full transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#C9A84C', color: '#1a2e1a' }}
        >
          Book a Free Consultation
        </a>
        <a
          href="mailto:sales@muslimadnetwork.com"
          className="inline-block px-6 py-2.5 text-sm font-semibold rounded-full transition-opacity hover:opacity-90"
          style={{ border: '1.5px solid rgba(255,255,255,0.7)', color: 'white' }}
        >
          Email Our Sales Team
        </a>
      </div>

      <p className="text-white/50 text-xs">
        Join leading Muslim brands already advertising in masajid across North America
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  data: MasjidConnectData | null
  isLoading: boolean
}

export default function MasjidConnectSection({ data, isLoading }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const showShowcase = data?.enabled && (data?.masjids?.length ?? 0) > 0

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Skeleton style={{ height: 180 }} />
            <div className="p-4" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton style={{ height: 14, borderRadius: 6, width: '70%' }} />
              <Skeleton style={{ height: 12, borderRadius: 6, width: '45%' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (showShowcase) {
    const masjids = data!.masjids
    return (
      <>
        {/* Section heading */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MosqueIcon size={16} color="#C9A84C" />
            <h2
              className="text-sm font-bold text-gray-800 uppercase tracking-wide"
              style={{ borderBottom: '2px solid #C9A84C', paddingBottom: '2px' }}
            >
              MasjidConnect
            </h2>
          </div>
          <span
            className="text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wide"
            style={{ backgroundColor: '#C9A84C', color: '#1a2e1a' }}
          >
            Live Placements
          </span>
        </div>

        <p className="text-sm text-[#64748b] mb-5">Your ads are reaching Muslims at the masjid</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {masjids.map((m, i) => (
            <MasjidCard key={m.id} masjid={m} onClick={() => setLightboxIndex(i)} />
          ))}
        </div>

        {lightboxIndex !== null && (
          <Lightbox
            masjids={masjids}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </>
    )
  }

  return <MarketingFallback />
}
