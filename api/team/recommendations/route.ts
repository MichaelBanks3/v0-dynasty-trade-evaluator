import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { generateRecommendations } from '@/lib/recommendation-generator'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const { userId } = auth()
  
  try {
    const body = await request.json()
    const { teamAAssets, teamBAssets, settings } = body

    if (!teamAAssets || !teamBAssets) {
      return NextResponse.json({ error: 'Missing team assets' }, { status: 400 })
    }

    // Get team profile if user is authenticated
    let teamProfile = null
    if (userId) {
      teamProfile = await prisma.teamProfile.findUnique({
        where: { userId },
      })
    }

    // Get current valuations for all assets
    const allAssetIds = [...teamAAssets, ...teamBAssets]
    const valuations = await prisma.valuation.findMany({
      where: {
        playerId: { in: allAssetIds },
        settingsHash: settings ? JSON.stringify(settings) : 'default'
      },
      include: {
        player: true
      }
    })

    // Get picks if any
    const picks = await prisma.pick.findMany({
      where: {
        id: { in: allAssetIds }
      }
    })

    // Combine players and picks
    const allAssets = [
      ...valuations.map(v => ({
        id: v.playerId,
        type: 'player' as const,
        name: v.player?.name || 'Unknown Player',
        position: v.player?.position || 'UNKNOWN',
        age: v.player?.age || 0,
        team: v.player?.team || 'UNKNOWN',
        nowScore: v.nowScore,
        futureScore: v.futureScore,
        composite: v.composite
      })),
      ...picks.map(p => ({
        id: p.id,
        type: 'pick' as const,
        name: `${p.year} Round ${p.round}`,
        position: 'PICK',
        age: 0,
        team: 'PICK',
        nowScore: p.baselineValue,
        futureScore: p.baselineValue,
        composite: p.baselineValue
      }))
    ]

    // Separate team assets
    const teamAAssetObjects = allAssets.filter(asset => teamAAssets.includes(asset.id))
    const teamBAssetObjects = allAssets.filter(asset => teamBAssets.includes(asset.id))

    // Generate recommendations
    const recommendations = generateRecommendations({
      teamAAssets: teamAAssetObjects,
      teamBAssets: teamBAssetObjects,
      settings: settings || {},
      teamProfile: teamProfile ? {
        timeline: teamProfile.timeline,
        riskTolerance: teamProfile.riskTolerance,
        roster: JSON.parse(teamProfile.roster as string),
        ownedPicks: JSON.parse(teamProfile.ownedPicks as string)
      } : null
    })

    // Track recommendation generation
    await trackEvent('advisor_recommendations', {
      payloadHash: generatePayloadHash({ 
        count: recommendations.length,
        assetCount: allAssetIds.length,
        hasProfile: !!teamProfile
      })
    })

    return NextResponse.json({
      recommendations,
      teamProfile: teamProfile ? {
        timeline: teamProfile.timeline,
        riskTolerance: teamProfile.riskTolerance,
        hasRoster: (JSON.parse(teamProfile.roster as string) as string[]).length > 0
      } : null
    })

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}
