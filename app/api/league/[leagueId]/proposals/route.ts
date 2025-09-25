import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateProposals } from '@/lib/proposal-generator'
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
    const opponentId = searchParams.get('opponentId')
    const objective = searchParams.get('objective') as 'win-now' | 'balanced' | 'future-lean' || 'balanced'

    if (!myTeamId || !opponentId) {
      return NextResponse.json({ error: 'myTeamId and opponentId are required' }, { status: 400 })
    }

    // Track proposal generation
    await trackEvent('trade_finder_select_opponent', {
      userId,
      payloadHash: generatePayloadHash({ 
        leagueId: leagueId.substring(0, 8),
        opponentId: opponentId.substring(0, 8),
        objective
      })
    })

    const proposals = await generateProposals(myTeamId, opponentId, leagueId, objective)

    if (proposals.length === 0) {
      // Track no proposals found
      await trackEvent('trade_finder_no_proposal', {
        userId,
        payloadHash: generatePayloadHash({ 
          leagueId: leagueId.substring(0, 8),
          opponentId: opponentId.substring(0, 8),
          objective
        })
      })

      return NextResponse.json({
        success: true,
        proposals: [],
        message: 'No fair proposals found—try different goals or opponent'
      })
    }

    return NextResponse.json({
      success: true,
      objective,
      proposals
    })

  } catch (error) {
    console.error('Error generating proposals:', error)
    return NextResponse.json({ 
      error: 'Failed to generate proposals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
