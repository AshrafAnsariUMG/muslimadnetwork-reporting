'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import axios from 'axios'

export interface SectionVisibility {
  section_hidden: boolean
  hidden_rows: string[]
}

export type VisibilityMap = Record<string, SectionVisibility>

interface UseVisibilityResult {
  isHidden: (section: string, rowKey?: string) => boolean
  toggle: (section: string, level: 'section' | 'row', rowKey: string | null, hidden: boolean) => Promise<void>
  isLoading: boolean
}

export function useVisibility(clientId?: number): UseVisibilityResult {
  const [settings, setSettings] = useState<VisibilityMap>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!clientId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    api.get<VisibilityMap>('/api/client/visibility')
      .then(({ data }) => setSettings(data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [clientId])

  const isHidden = useCallback((section: string, rowKey?: string): boolean => {
    const s = settings[section]
    if (!s) return false
    if (rowKey !== undefined) {
      return s.hidden_rows?.includes(rowKey) ?? false
    }
    return s.section_hidden ?? false
  }, [settings])

  const toggle = useCallback(async (
    section: string,
    level: 'section' | 'row',
    rowKey: string | null,
    hidden: boolean,
  ): Promise<void> => {
    if (!clientId) return

    // Optimistic update
    setSettings(prev => {
      const existing = prev[section] ?? { section_hidden: false, hidden_rows: [] }
      if (level === 'section') {
        return { ...prev, [section]: { ...existing, section_hidden: hidden } }
      }
      // row level
      const rows = existing.hidden_rows ?? []
      const newRows = hidden
        ? (rows.includes(rowKey!) ? rows : [...rows, rowKey!])
        : rows.filter(r => r !== rowKey)
      return { ...prev, [section]: { ...existing, hidden_rows: newRows } }
    })

    // API call using admin token (impersonation context)
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
      await axios.post(
        `${baseUrl}/api/admin/visibility/${clientId}`,
        { section, level, row_key: rowKey, is_hidden: hidden },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      )
    } catch (err) {
      // Revert optimistic update on failure
      setSettings(prev => {
        const existing = prev[section] ?? { section_hidden: false, hidden_rows: [] }
        if (level === 'section') {
          return { ...prev, [section]: { ...existing, section_hidden: !hidden } }
        }
        const rows = existing.hidden_rows ?? []
        const revertRows = !hidden
          ? (rows.includes(rowKey!) ? rows : [...rows, rowKey!])
          : rows.filter(r => r !== rowKey)
        return { ...prev, [section]: { ...existing, hidden_rows: revertRows } }
      })
    }
  }, [clientId])

  return { isHidden, toggle, isLoading }
}
