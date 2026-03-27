export function getDefaultDateRange(): { date_from: string; date_to: string } {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    date_from: toYMD(from),
    date_to: toYMD(to),
  }
}

export function toYMD(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  const normalized = date.includes('T') ? date : date + 'T00:00:00'
  const d = new Date(normalized)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

export function formatCTR(n: number): string {
  return n.toFixed(2) + '%'
}

export function formatConversions(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}
