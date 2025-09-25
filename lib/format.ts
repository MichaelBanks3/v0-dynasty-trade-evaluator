/**
 * Utility functions for formatting numbers and percentages
 * Always coerces to numbers to prevent NaN issues
 */

export function formatPts(value: number | string | null | undefined): string {
  const num = Number(value) || 0
  return num.toLocaleString()
}

export function formatPct(value: number | string | null | undefined): string {
  const num = Number(value) || 0
  return `${Math.round(num)}%`
}

export function formatDelta(value: number | string | null | undefined): string {
  const num = Number(value) || 0
  return `${Math.round(num)}%`
}

export function safeNumber(value: number | string | null | undefined): number {
  return Number(value) || 0
}

export function safePercentage(value: number | string | null | undefined, total: number | string | null | undefined): number {
  const num = Number(value) || 0
  const totalNum = Number(total) || 0
  return totalNum > 0 ? Math.min(100, (num / totalNum) * 100) : 0
}

export function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value) || 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleString()
  } catch {
    return '—'
  }
}
