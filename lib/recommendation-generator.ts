import { LeagueSettings } from './settings'
import { prisma } from './db'
import { RosterAnalysis, Player, Pick } from './roster-analysis'

export interface Recommendation {
  type: 'add' | 'remove' | 'swap'
  description: string
  reasoning: string
  assets: {
    add?: string[]
    remove?: string[]
  }
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export interface RecommendationContext {
  analysis: RosterAnalysis
  teamAAssets: string[]
  teamBAssets: string[]
  settings: LeagueSettings
  timeline: 'contend' | 'retool' | 'rebuild'
  riskTolerance: 'low' | 'medium' | 'high'
}

// Get available players for recommendations
export async function getAvailablePlayers(
  position: string,
  minValue: number = 0,
  maxValue: number = 10000
): Promise<Player[]> {
  const players = await prisma.player.findMany({
    where: {
      position,
      valuations: {
        some: {
          compositeValue: {
            gte: minValue,
            lte: maxValue
          }
        }
      }
    },
    include: {
      valuations: {
        where: { 
          scoring: 'PPR',
          superflex: false,
          tePremium: 1.0
        },
        take: 1
      }
    },
    take: 20 // Limit results
  })

  return players.map(player => ({
    id: player.id,
    name: player.name,
    position: player.position,
    team: player.team,
    age: player.age,
    status: player.status,
    compositeValue: player.valuations[0]?.compositeValue || 0,
    nowScore: player.valuations[0]?.nowScore || 0,
    futureScore: player.valuations[0]?.futureScore || 0
  }))
}

// Get available picks for recommendations
export async function getAvailablePicks(
  year?: number,
  round?: number
): Promise<Pick[]> {
  const whereClause: any = {}
  if (year) whereClause.year = year
  if (round) whereClause.round = round

  const picks = await prisma.pick.findMany({
    where: whereClause,
    take: 20
  })

  return picks.map(pick => ({
    id: pick.id,
    year: pick.year,
    round: pick.round,
    compositeValue: pick.baselineValue
  }))
}

// Generate recommendations based on analysis
export async function generateRecommendations(
  context: RecommendationContext
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = []
  const { analysis, teamAAssets, teamBAssets, settings, timeline, riskTolerance } = context

  // 1. Critical gap first (e.g., SF missing QB)
  if (analysis.flags.qbGap && settings.superflex) {
    const qbRecommendation = await generateQBGapRecommendation(context)
    if (qbRecommendation) {
      recommendations.push(qbRecommendation)
    }
  }

  // 2. Critical depth gaps
  for (const gap of analysis.flags.criticalGaps) {
    const depthRecommendation = await generateDepthGapRecommendation(context, gap)
    if (depthRecommendation) {
      recommendations.push(depthRecommendation)
    }
  }

  // 3. Thin depth issues
  for (const thin of analysis.flags.thinDepth) {
    if (thin.coverage < 0.3) { // Only for very thin depth
      const thinRecommendation = await generateThinDepthRecommendation(context, thin.position)
      if (thinRecommendation) {
        recommendations.push(thinRecommendation)
      }
    }
  }

  // 4. Timeline mismatch
  const timelineRecommendation = generateTimelineRecommendation(context)
  if (timelineRecommendation) {
    recommendations.push(timelineRecommendation)
  }

  // 5. Overpay check (if delta > 15%)
  const delta = Math.abs(
    teamAAssets.reduce((sum, id) => sum + (id.includes('player:') ? 1000 : 500), 0) -
    teamBAssets.reduce((sum, id) => sum + (id.includes('player:') ? 1000 : 500), 0)
  ) / Math.max(
    teamAAssets.reduce((sum, id) => sum + (id.includes('player:') ? 1000 : 500), 0),
    teamBAssets.reduce((sum, id) => sum + (id.includes('player:') ? 1000 : 500), 0)
  )

  if (delta > 0.15 && delta < 0.25) {
    const overpayRecommendation = generateOverpayRecommendation(context, delta)
    if (overpayRecommendation) {
      recommendations.push(overpayRecommendation)
    }
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

// Generate QB gap recommendation
async function generateQBGapRecommendation(
  context: RecommendationContext
): Promise<Recommendation | null> {
  const { teamAAssets, teamBAssets, settings } = context

  // Look for available QBs in the 2nd tier range
  const availableQBs = await getAvailablePlayers('QB', 800, 1500)
  
  if (availableQBs.length === 0) {
    return {
      type: 'add',
      description: 'Add a QB2 tier player to fix Superflex gap',
      reasoning: 'You need a viable QB2 for Superflex leagues. Consider asking for a mid-tier QB plus a small pick adjustment.',
      assets: {
        add: ['pick:2026:3'], // Suggest adding a 3rd round pick
        remove: ['pick:2025:4'] // And removing a 4th round pick
      },
      priority: 'critical'
    }
  }

  const qb = availableQBs[0]
  return {
    type: 'add',
    description: `Add ${qb.name} (QB2 tier) to fix Superflex gap`,
    reasoning: 'You need a viable QB2 for Superflex leagues. This QB provides solid depth.',
    assets: {
      add: [qb.id]
    },
    priority: 'critical'
  }
}

// Generate depth gap recommendation
async function generateDepthGapRecommendation(
  context: RecommendationContext,
  position: string
): Promise<Recommendation | null> {
  const availablePlayers = await getAvailablePlayers(position, 500, 1200)
  
  if (availablePlayers.length === 0) {
    return {
      type: 'add',
      description: `Add depth at ${position}`,
      reasoning: `You have no viable bench options at ${position}. Consider adding a depth piece.`,
      assets: {
        add: [`pick:2026:${position === 'QB' ? '2' : '3'}`]
      },
      priority: 'high'
    }
  }

  const player = availablePlayers[0]
  return {
    type: 'add',
    description: `Add ${player.name} for ${position} depth`,
    reasoning: `You have no viable bench options at ${position}. This player provides solid depth.`,
    assets: {
      add: [player.id]
    },
    priority: 'high'
  }
}

// Generate thin depth recommendation
async function generateThinDepthRecommendation(
  context: RecommendationContext,
  position: string
): Promise<Recommendation | null> {
  const { teamAAssets, teamBAssets } = context

  // Look for a player to swap from a position where you're heavy
  const heavyPositions = Object.entries(context.analysis.depthCoverage)
    .filter(([pos, data]) => pos !== position && data.coverage > 1.5)
    .map(([pos]) => pos)

  if (heavyPositions.length > 0) {
    const swapPosition = heavyPositions[0]
    const availablePlayers = await getAvailablePlayers(swapPosition, 400, 800)
    
    if (availablePlayers.length > 0) {
      return {
        type: 'swap',
        description: `Swap a ${swapPosition} for ${position} depth`,
        reasoning: `You're heavy at ${swapPosition} but thin at ${position}. Consider swapping a bench piece.`,
        assets: {
          remove: [availablePlayers[0].id],
          add: [`pick:2026:3`] // Simplified - would need actual position player
        },
        priority: 'medium'
      }
    }
  }

  return null
}

// Generate timeline recommendation
function generateTimelineRecommendation(
  context: RecommendationContext
): Recommendation | null {
  const { timeline, teamAAssets, teamBAssets } = context
  
  // Simplified timeline analysis
  const hasFuturePicks = teamAAssets.some(id => id.includes('pick:2027') || id.includes('pick:2028'))
  const hasVeterans = teamAAssets.some(id => id.includes('player:')) // Simplified check

  if (timeline === 'contend' && hasFuturePicks) {
    return {
      type: 'swap',
      description: 'Convert future picks to veteran depth',
      reasoning: 'You\'re in contend mode but trading for future picks. Consider asking for veteran depth instead.',
      assets: {
        remove: teamAAssets.filter(id => id.includes('pick:2027') || id.includes('pick:2028')).slice(0, 1),
        add: ['pick:2025:2'] // Simplified - would need actual veteran
      },
      priority: 'medium'
    }
  }

  if (timeline === 'rebuild' && hasVeterans) {
    return {
      type: 'swap',
      description: 'Convert veterans to future picks',
      reasoning: 'You\'re in rebuild mode but trading for veterans. Consider asking for future picks instead.',
      assets: {
        remove: teamAAssets.filter(id => id.includes('player:')).slice(0, 1),
        add: ['pick:2027:1'] // Simplified - would need actual future pick
      },
      priority: 'medium'
    }
  }

  return null
}

// Generate overpay recommendation
function generateOverpayRecommendation(
  context: RecommendationContext,
  delta: number
): Recommendation | null {
  const { teamAAssets, teamBAssets } = context

  // Find the smallest adjustment to get closer to even
  const adjustment = Math.round(delta * 0.3) // 30% of the overpay
  
  return {
    type: 'add',
    description: `Add small pick to balance trade (${Math.round(delta * 100)}% overpay)`,
    reasoning: `This trade is ${Math.round(delta * 100)}% in your favor. Consider adding a small pick to make it more balanced.`,
    assets: {
      add: ['pick:2026:4'] // Small pick adjustment
    },
    priority: 'low'
  }
}

// Check if trade is too lopsided for recommendations
export function isTradeTooLopsided(
  teamAAssets: string[],
  teamBAssets: string[]
): boolean {
  const delta = Math.abs(
    teamAAssets.reduce((sum, id) => sum + (id.includes('player:') ? 1000 : 500), 0) -
    teamBAssets.reduce((sum, id) => sum + (id.includes('player:') ? 1000 : 500), 0)
  ) / Math.max(
    teamAAssets.reduce((sum, id) => sum + (id.includes('player:') ? 1000 : 500), 0),
    teamBAssets.reduce((sum, id) => sum + (id.includes('player:') ? 1000 : 500), 0)
  )

  return delta > 0.25 // 25% threshold
}
