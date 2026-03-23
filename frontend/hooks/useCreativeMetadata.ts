import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { CreativeMetadata } from '@/types/reports'

interface Result {
  metadata: Record<string, CreativeMetadata>
  isLoading: boolean
  error: string | null
}

export function useCreativeMetadata(campaignId?: number, clientType?: string): Result {
  const [metadata, setMetadata] = useState<Record<string, CreativeMetadata>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!campaignId) return

    setIsLoading(true)
    setError(null)
    setMetadata({})

    const params: Record<string, number> = {}
    if (clientType === 'multi_campaign') params.campaign_id = campaignId

    api.get<CreativeMetadata[]>('/api/reports/creatives/metadata', { params })
      .then(({ data }) => {
        const keyed: Record<string, CreativeMetadata> = {}
        data.forEach(m => { keyed[m.name] = m })
        setMetadata(keyed)
      })
      .catch(err => {
        setError(err?.response?.data?.message ?? 'Failed to load creative metadata')
        setMetadata({})
      })
      .finally(() => setIsLoading(false))
  }, [campaignId, clientType])

  return { metadata, isLoading, error }
}
