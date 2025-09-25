import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { computeMatchmaking } from '@/lib/matchmaking-engine'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  const { userId } = auth()
  
  try {
    const { leagueId } = params
    const { searchParams } = new URL(request.url)
    const myTeamId = searchParams.get('myTeamId')
    const objective = searchParams.get('objective') as 'win-now' | 'balanced' | 'future-lean' || 'balanced'

    if (!myTeamId) {
      return NextResponse.json({ error: 'myTeamId is required' }, { status: 400 })
    }

    // Track matchmaking request
    await trackEvent('trade_finder_open', {
      userId,
      payloadHash: generatePayloadHash({ 
        leagueId: leagueId.substring(0, 8),
        objective
      })
    })

    const results = await computeMatchmaking(myTeamId, leagueId, objective)

    return NextResponse.json({
      success: true,
      objective,
      results
    })

  } catch (error) {
    console.error('Error in matchmaking:', error)
    return NextResponse.json({ 
      error: 'Failed to compute matchmaking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
