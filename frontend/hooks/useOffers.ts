'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

export interface Offer {
  id: number
  title: string
  body: string
  cta_label: string
  cta_url: string
  target: 'global' | 'specific_client'
  client_id: number | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

interface UseOffersResult {
  offers: Offer[]
  isLoading: boolean
  dismissOffer: (id: number) => void
}

export function useOffers(): UseOffersResult {
  const [offers, setOffers] = useState<Offer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get<Offer[]>('/api/client/offers')
      .then(({ data }) => setOffers(data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const dismissOffer = useCallback((id: number) => {
    // Optimistic update — remove immediately
    setOffers(prev => prev.filter(o => o.id !== id))
    api.post(`/api/client/offers/${id}/dismiss`).catch(() => {})
  }, [])

  return { offers, isLoading, dismissOffer }
}
