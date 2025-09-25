// Utility functions for formatting numbers, percentages, and other values

export function formatPts(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }
  return Math.round(value).toLocaleString()
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%'
  }
  return `${Math.abs(value).toFixed(1)}%`
}

export function safeNumber(value: any): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Never'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'Never'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}