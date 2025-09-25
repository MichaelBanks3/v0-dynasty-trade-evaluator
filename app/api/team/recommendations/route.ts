import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { generateRecommendations } from '@/lib/recommendation-generator'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const authResult = await auth()
  const userId = authResult?.userId
  
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

    // Convert string IDs to numbers for Prisma queries
    const allAssetIds = [...teamAAssets, ...teamBAssets].map(id => parseInt(id)).filter(id => !isNaN(id))
    
    // Get current valuations for all assets
    const valuations = await prisma.valuation.findMany({
      where: {
        playerId: { in: allAssetIds },
        scoring: settings?.scoring || 'PPR',
        superflex: settings?.superflex || false,
        tePremium: settings?.tePremium || 1.0
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
        id: v.playerId.toString(),
        type: 'player' as const,
        name: v.player?.name || 'Unknown Player',
        position: v.player?.position || 'UNKNOWN',
        age: v.player?.age || 0,
        team: v.player?.team || 'UNKNOWN',
        nowScore: v.nowScore || 0,
        futureScore: v.futureScore || 0,
        composite: (v.nowScore || 0) + (v.futureScore || 0)
      })),
      ...picks.map(p => ({
        id: p.id.toString(),
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

    // Generate recommendations with proper types
    const recommendations = await generateRecommendations({
      analysis: {
        depthCoverage: {
          QB: 1.0,
          RB: 1.0,
          WR: 1.0,
          TE: 1.0
        },
        flags: {
          qbGap: false,
          criticalGaps: [],
          thinDepth: [],
          riskFlags: [],
          ageSkew: []
        }
      },
      teamAAssets: teamAAssets,
      teamBAssets: teamBAssets,
      settings: settings || {},
      timeline: (teamProfile?.timeline as 'contend' | 'retool' | 'rebuild') || 'contend',
      riskTolerance: (teamProfile?.riskTolerance as 'low' | 'medium' | 'high') || 'medium'
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
        hasRoster: teamProfile.roster ? (JSON.parse(teamProfile.roster as string) as string[]).length > 0 : false
      } : null
    })

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}
