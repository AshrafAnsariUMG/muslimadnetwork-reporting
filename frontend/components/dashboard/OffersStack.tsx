'use client'

import { useState } from 'react'
import { Offer } from '@/hooks/useOffers'
import OfferBanner from './OfferBanner'

interface Props {
  offers: Offer[]
  onDismiss: (id: number) => void
}

export default function OffersStack({ offers, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (offers.length === 0) return null

  const first = offers[0]
  const rest = offers.slice(1)

  return (
    <div className="space-y-2">
      <OfferBanner offer={first} onDismiss={() => onDismiss(first.id)} />

      {rest.length > 0 && (
        <>
          {!expanded ? (
            <div className="flex justify-center">
              <button
                onClick={() => setExpanded(true)}
                className="text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
                style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}
              >
                +{rest.length} more {rest.length === 1 ? 'offer' : 'offers'}
              </button>
            </div>
          ) : (
            <div
              className="space-y-2"
              style={{
                animation: 'fadeIn 200ms ease',
              }}
            >
              {rest.map(offer => (
                <OfferBanner key={offer.id} offer={offer} onDismiss={() => onDismiss(offer.id)} />
              ))}
              <div className="flex justify-center">
                <button
                  onClick={() => setExpanded(false)}
                  className="text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                >
                  Show less
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
