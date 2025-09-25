import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { analyzeTradeImpact, type TeamProfile } from '@/lib/roster-analysis'
import { LeagueSettings, DEFAULT_SETTINGS, validateSettings } from '@/lib/settings'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { teamAAssets, teamBAssets, settings } = body

    // Get user's team profile
    const profile = await prisma.teamProfile.findUnique({
      where: { userId }
    })

    if (!profile) {
      return NextResponse.json({ error: 'No team profile found' }, { status: 404 })
    }

    // Parse profile data
    const teamProfile: TeamProfile = {
      timeline: profile.timeline as 'contend' | 'retool' | 'rebuild',
      riskTolerance: profile.riskTolerance as 'low' | 'medium' | 'high',
      leagueSettings: profile.leagueSettings ? 
        JSON.parse(profile.leagueSettings as string) : 
        validateSettings(settings || DEFAULT_SETTINGS),
      roster: JSON.parse(profile.roster as string),
      ownedPicks: JSON.parse(profile.ownedPicks as string)
    }

    // Analyze trade impact
    const analysis = await analyzeTradeImpact(
      teamProfile,
      teamAAssets || [],
      teamBAssets || []
    )

    const duration = Date.now() - startTime

    // Track performance
    await trackEvent('advisor_view', {
      userId,
      payloadHash: generatePayloadHash({ 
        assetCount: (teamAAssets?.length || 0) + (teamBAssets?.length || 0),
        hasProfile: true
      }),
      durationMs: duration
    })

    return NextResponse.json({
      success: true,
      analysis,
      performance: {
        durationMs: duration
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('Error analyzing trade:', error)
    
    // Track error
    await trackEvent('advisor_view', {
      userId,
      payloadHash: generatePayloadHash({ error: true }),
      durationMs: duration
    })

    return NextResponse.json({ 
      error: 'Failed to analyze trade',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
