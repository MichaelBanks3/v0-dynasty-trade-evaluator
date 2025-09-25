import { prisma } from './db'

// Event types for analytics
export type EventType = 
  | 'evaluate'
  | 'save_trade'
  | 'open_shared'
  | 'settings_update'
  | 'admin_config_update'
  | 'admin_refresh'
  | 'advisor_view'
  | 'advisor_flag'
  | 'advisor_apply_suggestion'
  | 'advisor_explainer_copy'
  | 'advisor_recommendations'
  | 'league_import_start'
  | 'league_import_success'
  | 'league_import_fail'
  | 'league_select_team'
  | 'league_benchmark_view'
  | 'results_league_chips_view'
  | 'trade_finder_open'
  | 'trade_finder_select_opponent'
  | 'trade_finder_apply_proposal'
  | 'trade_finder_copy_blurb'
  | 'trade_finder_no_proposal'

// Track an event for analytics (client-safe version)
export async function trackEvent(
  eventType: EventType,
  options: {
    userId?: string
    anonId?: string
    payloadHash?: string
    durationMs?: number
  } = {}
) {
  try {
    // Use fetch to call the analytics API endpoint instead of direct Prisma
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        userId: options.userId || null,
        anonId: options.anonId || null,
        payloadHash: options.payloadHash || null,
        durationMs: options.durationMs || null
      })
    })
  } catch (error) {
    // Don't throw errors for analytics - just log them
    console.error('Failed to track event:', error)
  }
}

// Generate a simple hash for payload deduplication
export function generatePayloadHash(payload: any): string {
  const str = JSON.stringify(payload)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

// Get analytics summary for admin health page
export async function getAnalyticsSummary() {
  try {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Get event counts by type for last 24h
    const eventCounts = await prisma.event.groupBy({
      by: ['eventType'],
      where: {
        createdAt: {
          gte: last24h
        }
      },
      _count: {
        eventType: true
      }
    })

    // Get total evaluation count and average duration
    const evaluationStats = await prisma.event.aggregate({
      where: {
        eventType: 'evaluate',
        createdAt: {
          gte: last24h
        },
        durationMs: {
          not: null
        }
      },
      _count: {
        id: true
      },
      _avg: {
        durationMs: true
      },
      _max: {
        durationMs: true
      }
    })

    // Calculate p95 latency (simplified)
    const p95Duration = evaluationStats._max.durationMs ? 
      Math.round(evaluationStats._max.durationMs * 0.95) : null

    return {
      last24h: {
        totalEvents: eventCounts.reduce((sum, item) => sum + item._count.eventType, 0),
        eventCounts: eventCounts.map(item => ({
          type: item.eventType,
          count: item._count.eventType
        })),
        evaluations: {
          count: evaluationStats._count.id,
          avgDurationMs: Math.round(evaluationStats._avg.durationMs || 0),
          p95DurationMs: p95Duration
        }
      }
    }
  } catch (error) {
    console.error('Failed to get analytics summary:', error)
    return {
      last24h: {
        totalEvents: 0,
        eventCounts: [],
        evaluations: {
          count: 0,
          avgDurationMs: 0,
          p95DurationMs: 0
        }
      }
    }
  }
}
