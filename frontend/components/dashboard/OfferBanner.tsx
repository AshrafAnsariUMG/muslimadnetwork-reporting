'use client'

import { useState } from 'react'
import { Offer } from '@/hooks/useOffers'

interface Props {
  offer: Offer
  onDismiss: () => void
}

const GiftIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
)

export default function OfferBanner({ offer, onDismiss }: Props) {
  const [fading, setFading] = useState(false)

  const handleDismiss = () => {
    setFading(true)
    setTimeout(onDismiss, 300)
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: '#1a4a2e',
        border: '2px solid #C9A84C',
        boxShadow: '0 4px 16px rgba(26,74,46,0.25)',
        opacity: fading ? 0 : 1,
        transform: fading ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'opacity 300ms ease, transform 300ms ease',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
        {/* Top row: icon + content + dismiss */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white mt-0.5"
            style={{ backgroundColor: 'rgba(201,168,76,0.2)' }}
          >
            <GiftIcon />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-snug">{offer.title}</p>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>{offer.body}</p>
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            title="Dismiss"
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.2)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.1)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* CTA button */}
        <a
          href={offer.cta_url}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start sm:self-auto sm:flex-shrink-0 px-4 py-1.5 text-sm font-semibold rounded-full transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#ffffff', color: '#1a4a2e', border: '1px solid #C9A84C' }}
        >
          {offer.cta_label}
        </a>
      </div>
    </div>
  )
}
