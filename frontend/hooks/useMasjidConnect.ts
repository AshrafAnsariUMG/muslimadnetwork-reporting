import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { MasjidConnectData } from '@/types/reports'

export function useMasjidConnect(campaignId?: number) {
  const [data, setData] = useState<MasjidConnectData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const params = campaignId ? { campaign_id: campaignId } : {}
    api.get<MasjidConnectData>('/api/client/masjid-connect', { params })
      .then(({ data }) => setData(data))
      .catch(() => setData({ enabled: false, masjids: [] }))
      .finally(() => setIsLoading(false))
  }, [campaignId])

  return { data, isLoading }
}
