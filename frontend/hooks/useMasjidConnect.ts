import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { MasjidConnectData } from '@/types/reports'

export function useMasjidConnect() {
  const [data, setData] = useState<MasjidConnectData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get<MasjidConnectData>('/api/client/masjid-connect')
      .then(({ data }) => setData(data))
      .catch(() => setData({ enabled: false, masjids: [] }))
      .finally(() => setIsLoading(false))
  }, [])

  return { data, isLoading }
}
