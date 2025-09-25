import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { calculatePickValuation, generateTradeExplanation, generateBalancingSuggestion } from '@/lib/valuation'
import { LeagueSettings, DEFAULT_SETTINGS, getSettingsHash, validateSettings } from '@/lib/settings'
import { generateTradeSlug } from '@/lib/slug'
import { safeArray } from '@/lib/safe'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface EvaluateRequest {
  teamA: string[]
  teamB: string[]
  settings?: LeagueSettings
}

interface AssetBreakdown {
  id: string
  type: 'player' | 'pick'
  label: string
  marketValue?: number
  projNow?: number
  projFuture?: number
  ageAdjustment?: number
  riskAdjustment?: number
  nowScore: number
  futureScore: number
  compositeValue: number
  settingsAdjustments?: {
    qbMultiplier: number
    teMultiplier: number
    scoringFactor: number
    vorMultiplier: number
    combinedMultiplier: number
  }
}

interface EvaluateResponse {
  totals: {
    teamA: {
      nowScore: number
      futureScore: number
      compositeValue: number
    }
    teamB: {
      nowScore: number
      futureScore: number
      compositeValue: number
    }
  }
  verdict: string
  explanation: string
  suggestion?: string
  assets: {
    teamA: AssetBreakdown[]
    teamB: AssetBreakdown[]
  }
  saved: boolean
  slug?: string
}

// Cache for evaluation results
const evaluationCache = new Map<string, EvaluateResponse>()

function getCacheKey(teamA: string[], teamB: string[], settings: LeagueSettings): string {
  const settingsHash = getSettingsHash(settings)
  return `${teamA.sort().join(',')}|${teamB.sort().join(',')}|${settingsHash}`
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const { userId } = await auth()
  
  try {
    const body: EvaluateRequest = await request.json()
    const { teamA, teamB, settings = {} } = body
    
    // Validate input
    const safeTeamA = safeArray(teamA)
    const safeTeamB = safeArray(teamB)
    
    if (safeTeamA.length === 0 && safeTeamB.length === 0) {
      return NextResponse.json({ error: 'At least one team must have assets' }, { status: 400 })
    }
    
    // Check cache first
    const cacheKey = getCacheKey(safeTeamA, safeTeamB, settings)
    const cached = evaluationCache.get(cacheKey)
    if (cached) {
      console.log('Cache hit for evaluation')
      return NextResponse.json(cached)
    }
    
    // Get user settings or use defaults
    let finalSettings: LeagueSettings
    if (Object.keys(settings).length > 0) {
      // Use provided settings
      finalSettings = validateSettings(settings)
    } else {
      // Get user's saved settings or use defaults
      const { userId } = await auth()
      if (userId) {
        const userSettings = await prisma.userSettings.findUnique({
          where: { userId }
        })
        finalSettings = userSettings ? validateSettings(userSettings.settings as LeagueSettings) : DEFAULT_SETTINGS
      } else {
        finalSettings = DEFAULT_SETTINGS
      }
    }
    
    // Process team A assets
    const teamAAssets: AssetBreakdown[] = []
    let teamANowScore = 0
    let teamAFutureScore = 0
    let teamACompositeValue = 0
    
    for (const assetId of safeTeamA) {
      const breakdown = await getAssetBreakdown(assetId, finalSettings)
      if (breakdown) {
        teamAAssets.push(breakdown)
        teamANowScore += breakdown.nowScore
        teamAFutureScore += breakdown.futureScore
        teamACompositeValue += breakdown.compositeValue
      }
    }
    
    // Process team B assets
    const teamBAssets: AssetBreakdown[] = []
    let teamBNowScore = 0
    let teamBFutureScore = 0
    let teamBCompositeValue = 0
    
    for (const assetId of safeTeamB) {
      const breakdown = await getAssetBreakdown(assetId, finalSettings)
      if (breakdown) {
        teamBAssets.push(breakdown)
        teamBNowScore += breakdown.nowScore
        teamBFutureScore += breakdown.futureScore
        teamBCompositeValue += breakdown.compositeValue
      }
    }
    
    // Determine verdict
    const totalDiff = Math.abs(teamACompositeValue - teamBCompositeValue)
    const percentDiff = (totalDiff / Math.max(teamACompositeValue, teamBCompositeValue)) * 100
    
    let verdict: string
    if (percentDiff <= 5) {
      verdict = 'FAIR'
    } else if (teamACompositeValue > teamBCompositeValue) {
      verdict = 'FAVORS_A'
    } else {
      verdict = 'FAVORS_B'
    }
    
    // Generate explanation and suggestion
    const explanation = generateTradeExplanation(
      teamANowScore, teamAFutureScore,
      teamBNowScore, teamBFutureScore,
      verdict
    )
    
    const suggestion = generateBalancingSuggestion(
      teamANowScore, teamAFutureScore,
      teamBNowScore, teamBFutureScore,
      verdict
    )
    
    const result: EvaluateResponse = {
      totals: {
        teamA: {
          nowScore: teamANowScore,
          futureScore: teamAFutureScore,
          compositeValue: teamACompositeValue
        },
        teamB: {
          nowScore: teamBNowScore,
          futureScore: teamBFutureScore,
          compositeValue: teamBCompositeValue
        }
      },
      verdict,
      explanation,
      suggestion: suggestion || undefined,
      assets: {
        teamA: teamAAssets,
        teamB: teamBAssets
      },
      saved: false
    }
    
    // Cache the result
    evaluationCache.set(cacheKey, result)
    
    // Save to database if user is authenticated
    const { userId } = await auth()
    if (userId) {
      try {
        // Ensure user exists
        await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: { id: userId }
        })
        
        // Generate unique slug
        const slug = generateTradeSlug()
        
        // Save trade with full evaluation snapshot
        await prisma.trade.create({
          data: {
            userId,
            slug,
            teamA: JSON.stringify(safeTeamA),
            teamB: JSON.stringify(safeTeamB),
            settings: JSON.stringify(finalSettings),
            verdict,
            nowDelta: teamANowScore - teamBNowScore,
            futureDelta: teamAFutureScore - teamBFutureScore,
            breakdown: JSON.stringify(result.assets),
            evaluationSnapshot: JSON.stringify(result), // Full evaluation result
            // Legacy fields for backward compatibility
            sideAPlayerIds: safeTeamA.filter(id => id.startsWith('player:')).map(id => id.replace('player:', '')),
            sideBPlayerIds: safeTeamB.filter(id => id.startsWith('player:')).map(id => id.replace('player:', '')),
            totalA: teamACompositeValue,
            totalB: teamBCompositeValue
          }
        })
        
        result.saved = true
        result.slug = slug
      } catch (dbError) {
        console.error('Failed to save trade:', dbError)
        // Continue without saving
      }
    }
    
    // Track evaluation event
    const durationMs = Date.now() - startTime
    await trackEvent('evaluate', {
      userId: userId || undefined,
      payloadHash: generatePayloadHash({ teamA: safeTeamA, teamB: safeTeamB, settings: finalSettings }),
      durationMs
    })

    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Evaluation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getAssetBreakdown(assetId: string, settings: LeagueSettings): Promise<AssetBreakdown | null> {
  try {
    if (assetId.startsWith('player:')) {
      const playerId = parseInt(assetId.replace('player:', ''))
      
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        include: {
          valuations: {
            where: {
              scoring: 'PPR', // Always use PPR base valuations
              superflex: false,
              tePremium: 1.0
            }
          }
        }
      })
      
      if (!player || !player.valuations[0]) {
        return null
      }
      
      const valuation = player.valuations[0]
      
      // Calculate valuation with settings adjustments
      const { calculatePlayerValuation } = await import('@/lib/valuation')
      const result = calculatePlayerValuation(
        valuation.marketValue || 0,
        valuation.projNow || 0,
        valuation.projFuture || 0,
        player.position,
        player.age,
        player.status,
        settings
      )
      
      return {
        id: assetId,
        type: 'player',
        label: player.name,
        marketValue: valuation.marketValue || 0,
        projNow: valuation.projNow || 0,
        projFuture: valuation.projFuture || 0,
        ageAdjustment: result.ageAdjustment,
        riskAdjustment: result.riskAdjustment,
        nowScore: result.nowScore,
        futureScore: result.futureScore,
        compositeValue: result.compositeValue,
        settingsAdjustments: result.settingsAdjustments
      }
    } else if (assetId.startsWith('pick:')) {
      const pickId = parseInt(assetId.replace('pick:', ''))
      
      const pick = await prisma.pick.findUnique({
        where: { id: pickId }
      })
      
      if (!pick) {
        return null
      }
      
      const compositeValue = pick.compositeValue || calculatePickValuation(pick.year, pick.round, pick.baselineValue)
      
      return {
        id: assetId,
        type: 'pick',
        label: pick.label,
        marketValue: pick.marketValue || pick.baselineValue,
        projNow: 0, // Picks don't have current season projections
        projFuture: compositeValue, // Picks are purely future value
        ageAdjustment: 1.0, // Picks don't have age adjustments
        riskAdjustment: 1.0, // Picks don't have risk adjustments
        nowScore: 0, // Picks don't contribute to win-now
        futureScore: compositeValue,
        compositeValue
      }
    }
    
    return null
  } catch (error) {
    console.error(`Error getting asset breakdown for ${assetId}:`, error)
    return null
  }
}
