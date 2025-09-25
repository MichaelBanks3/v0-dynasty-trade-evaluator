import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { EventType } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventType, userId, anonId, payloadHash, durationMs } = body

    // Validate event type
    const validEventTypes: EventType[] = [
      'evaluate', 'save_trade', 'open_shared', 'settings_update',
      'admin_config_update', 'admin_refresh', 'advisor_view', 'advisor_flag',
      'advisor_apply_suggestion', 'advisor_explainer_copy', 'advisor_recommendations',
      'league_import_start', 'league_import_success', 'league_import_fail',
      'league_select_team', 'league_benchmark_view', 'results_league_chips_view',
      'trade_finder_open', 'trade_finder_select_opponent', 'trade_finder_apply_proposal',
      'trade_finder_copy_blurb', 'trade_finder_no_proposal'
    ]

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    // Create the event record
    await prisma.event.create({
      data: {
        eventType,
        userId: userId || null,
        anonId: anonId || null,
        payloadHash: payloadHash || null,
        durationMs: durationMs || null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to track analytics event:', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
