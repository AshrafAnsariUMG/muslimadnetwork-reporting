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

/**
 * Returns the percentage of contracted impressions that should have been
 * delivered by today, based on days elapsed vs total campaign days.
 */
export function getPacingPercentage(
  impressions: number,
  contracted: number,
  startDate: string,
  endDate: string,
): number {
  if (!contracted || contracted <= 0) return 0
  if (!startDate || !endDate) return 0

  const start = new Date(startDate.includes('T') ? startDate : startDate + 'T00:00:00').getTime()
  const end = new Date(endDate.includes('T') ? endDate : endDate + 'T00:00:00').getTime()
  if (isNaN(start) || isNaN(end)) return 0

  const today = Date.now()
  const totalDays = (end - start) / 86400000
  if (totalDays <= 0) return 100

  const elapsed = Math.min(Math.max((today - start) / 86400000, 0), totalDays)
  const expectedFraction = elapsed / totalDays
  if (expectedFraction === 0) return 100

  const deliveredFraction = impressions / contracted
  return (deliveredFraction / expectedFraction) * 100
}
