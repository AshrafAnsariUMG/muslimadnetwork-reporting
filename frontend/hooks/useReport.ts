'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

interface UseReportResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useReport<T>(
  type: string,
  dateFrom: string,
  dateTo: string,
  campaignId?: number,
): UseReportResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!dateFrom || !dateTo || !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) return

    let cancelled = false
    setIsLoading(true)
    setError(null)
    setData(null)

    const params: Record<string, string> = { date_from: dateFrom, date_to: dateTo }
    if (campaignId) params.campaign_id = String(campaignId)

    api
      .get<T>(`/api/reports/${type}`, { params })
      .then(({ data: result }) => {
        if (!cancelled) {
          setData(result)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? 'Failed to load data.'
          setError(msg)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [type, dateFrom, dateTo, campaignId, tick])

  return { data, isLoading, error, refetch }
}
