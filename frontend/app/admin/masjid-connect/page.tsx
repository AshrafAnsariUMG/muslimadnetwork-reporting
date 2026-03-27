'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { MosqueIcon } from '@/components/ui/IslamicIcons'

interface ClientRow {
  id: number
  name: string
  masjids_count?: number
}

export default function MasjidConnectOverviewPage() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/clients').then(({ data }) => {
      // Filter to only clients with masjidconnect_enabled
      const enabled = data
        .filter((c: { masjidconnect_enabled: boolean }) => c.masjidconnect_enabled)
        .map((c: { id: number; name: string }) => ({ id: c.id, name: c.name }))
      setClients(enabled)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <MosqueIcon size={32} color="#C9A84C" />
        <div>
          <h1 className="text-lg font-bold text-gray-900">MasjidConnect</h1>
          <p className="text-xs text-[#64748b] mt-0.5">Manage masjid screen placements per client</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl h-48 animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
      ) : clients.length === 0 ? (
        <div
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-16"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <div className="mb-4 opacity-40">
            <MosqueIcon size={32} color="#C9A84C" />
          </div>
          <p className="text-sm text-[#64748b] font-medium">No clients have MasjidConnect enabled.</p>
          <p className="text-xs text-[#94a3b8] mt-1">Enable it per client on the Clients page.</p>
          <Link
            href="/admin/clients"
            className="mt-5 px-5 py-2 text-sm font-semibold text-white rounded-full"
            style={{ backgroundColor: '#1a4a2e' }}
          >
            Go to Clients
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-t border-gray-100"
                  style={{ backgroundColor: i % 2 === 1 ? '#f8fafc' : '#fff' }}
                >
                  <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/masjid-connect/${c.id}`}
                      className="text-xs font-semibold px-4 py-1.5 rounded-full"
                      style={{ backgroundColor: '#fef9ec', color: '#92640a' }}
                    >
                      Manage Masjids
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
