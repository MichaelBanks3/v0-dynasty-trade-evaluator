import { LeagueSettings } from './settings'
import { prisma } from './db'
import { 
  analyzeTradeImpact,
  type TeamProfile
} from './roster-analysis'

export interface TradeProposal {
  id: string
  type: 'win-now' | 'balanced' | 'future-lean'
  myAssets: string[]
  theirAssets: string[]
  verdict: string
  delta: number // percentage difference
  rationale: {
    myBenefits: string[]
    theirBenefits: string[]
  }
  isViable: boolean
  warnings: string[]
}

export interface ProposalContext {
  myTeamId: string
  opponentId: string
  leagueId: string
  objective: 'win-now' | 'balanced' | 'future-lean'
  myBenchmark: any
  opponentBenchmark: any
  leagueSettings: LeagueSettings
  myAssets: Array<{
    id: string
    name: string
    position: string
    age: number
    nowScore: number
    futureScore: number
    composite: number
  }>
  theirAssets: Array<{
    id: string
    name: string
    position: string
    age: number
    nowScore: number
    futureScore: number
    composite: number
  }>
  myPicks: string[]
  theirPicks: string[]
}

export async function generateProposals(
  myTeamId: string,
  opponentId: string,
  leagueId: string,
  objective: 'win-now' | 'balanced' | 'future-lean'
): Promise<TradeProposal[]> {
  try {
    // Get league and team data
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        teams: {
          where: { id: { in: [myTeamId, opponentId] } },
          include: {
            roster: true,
            picks: true
          }
        }
      }
    })

    if (!league) {
      throw new Error('League not found')
    }

    const myTeam = league.teams.find(t => t.id === myTeamId)
    const opponentTeam = league.teams.find(t => t.id === opponentId)

    if (!myTeam || !opponentTeam || !myTeam.roster || !opponentTeam.roster) {
      throw new Error('Team data not found')
    }

    // Parse league settings
    let leagueSettings: LeagueSettings
    if (league.settingsSnapshot) {
      leagueSettings = JSON.parse(league.settingsSnapshot as string)
    } else {
      throw new Error('No league settings found')
    }

    // Get player data for both teams
    const myPlayerIds = JSON.parse(myTeam.roster.playerIds as string) as string[]
    const theirPlayerIds = JSON.parse(opponentTeam.roster.playerIds as string) as string[]

    const allPlayers = await prisma.player.findMany({
      where: { id: { in: [...myPlayerIds, ...theirPlayerIds] } },
      include: {
        valuations: {
          where: {
            settingsHash: JSON.stringify(leagueSettings)
          }
        }
      }
    })

    // Create asset arrays with valuations
    const myAssets = allPlayers
      .filter(p => myPlayerIds.includes(p.id) && p.valuations.length > 0)
      .map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        age: p.age,
        nowScore: p.valuations[0].nowScore,
        futureScore: p.valuations[0].futureScore,
        composite: p.valuations[0].composite
      }))

    const theirAssets = allPlayers
      .filter(p => theirPlayerIds.includes(p.id) && p.valuations.length > 0)
      .map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        age: p.age,
        nowScore: p.valuations[0].nowScore,
        futureScore: p.valuations[0].futureScore,
        composite: p.valuations[0].composite
      }))

    // Get picks
    const myPicks = myTeam.picks.map(pick => `${pick.year}-${pick.round}`)
    const theirPicks = opponentTeam.picks.map(pick => `${pick.year}-${pick.round}`)

    // Get team benchmarks (simplified - would normally call benchmark API)
    const myBenchmark = await getTeamBenchmark(myTeamId, leagueId)
    const opponentBenchmark = await getTeamBenchmark(opponentId, leagueId)

    // Create proposal context
    const context: ProposalContext = {
      myTeamId,
      opponentId,
      leagueId,
      objective,
      myBenchmark,
      opponentBenchmark,
      leagueSettings,
      myAssets,
      theirAssets,
      myPicks,
      theirPicks
    }

    // Generate proposals based on objective
    const proposals: TradeProposal[] = []

    if (objective === 'win-now') {
      proposals.push(...generateWinNowProposals(context))
    } else if (objective === 'future-lean') {
      proposals.push(...generateFutureLeanProposals(context))
    } else {
      proposals.push(...generateBalancedProposals(context))
    }

    // Filter out non-viable proposals and return top 3
    return proposals
      .filter(p => p.isViable)
      .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta)) // Prefer more balanced
      .slice(0, 3)

  } catch (error) {
    console.error('Error generating proposals:', error)
    throw error
  }
}

function generateWinNowProposals(context: ProposalContext): TradeProposal[] {
  const proposals: TradeProposal[] = []

  // Win-Now: Send future assets, get win-now assets
  const myFutureAssets = context.myAssets
    .filter(a => a.futureScore > a.nowScore)
    .sort((a, b) => b.futureScore - a.futureScore)

  const theirWinNowAssets = context.theirAssets
    .filter(a => a.nowScore > a.futureScore)
    .sort((a, b) => b.nowScore - a.nowScore)

  // Find complementary positions
  const mySurplus = context.myBenchmark.surplus
  const theirNeeds = context.opponentBenchmark.needs
  const myNeeds = context.myBenchmark.needs
  const theirSurplus = context.opponentBenchmark.surplus

  // Proposal 1: Direct position swap
  for (const position of mySurplus) {
    if (theirNeeds.includes(position)) {
      const myAsset = myFutureAssets.find(a => a.position === position)
      const theirAsset = theirWinNowAssets.find(a => a.position === position)

      if (myAsset && theirAsset) {
        const proposal = createProposal(
          'win-now',
          [myAsset.id],
          [theirAsset.id],
          context,
          `Direct ${position} swap for win-now boost`
        )
        if (proposal) proposals.push(proposal)
      }
    }
  }

  // Proposal 2: Future pick for veteran
  if (myFutureAssets.length > 0 && theirWinNowAssets.length > 0) {
    const myAsset = myFutureAssets[0]
    const theirAsset = theirWinNowAssets[0]

    const proposal = createProposal(
      'win-now',
      [myAsset.id],
      [theirAsset.id],
      context,
      'Future prospect for veteran contributor'
    )
    if (proposal) proposals.push(proposal)
  }

  return proposals
}

function generateFutureLeanProposals(context: ProposalContext): TradeProposal[] {
  const proposals: TradeProposal[] = []

  // Future-Lean: Send win-now assets, get future assets
  const myWinNowAssets = context.myAssets
    .filter(a => a.nowScore > a.futureScore)
    .sort((a, b) => b.nowScore - a.nowScore)

  const theirFutureAssets = context.theirAssets
    .filter(a => a.futureScore > a.nowScore)
    .sort((a, b) => b.futureScore - a.futureScore)

  // Find complementary positions
  const mySurplus = context.myBenchmark.surplus
  const theirNeeds = context.opponentBenchmark.needs

  // Proposal 1: Direct position swap
  for (const position of mySurplus) {
    if (theirNeeds.includes(position)) {
      const myAsset = myWinNowAssets.find(a => a.position === position)
      const theirAsset = theirFutureAssets.find(a => a.position === position)

      if (myAsset && theirAsset) {
        const proposal = createProposal(
          'future-lean',
          [myAsset.id],
          [theirAsset.id],
          context,
          `Direct ${position} swap for future upside`
        )
        if (proposal) proposals.push(proposal)
      }
    }
  }

  // Proposal 2: Veteran for future pick
  if (myWinNowAssets.length > 0 && theirFutureAssets.length > 0) {
    const myAsset = myWinNowAssets[0]
    const theirAsset = theirFutureAssets[0]

    const proposal = createProposal(
      'future-lean',
      [myAsset.id],
      [theirAsset.id],
      context,
      'Veteran for future prospect'
    )
    if (proposal) proposals.push(proposal)
  }

  return proposals
}

function generateBalancedProposals(context: ProposalContext): TradeProposal[] {
  const proposals: TradeProposal[] = []

  // Balanced: Even mix, use picks to balance
  const myAssets = context.myAssets.sort((a, b) => b.composite - a.composite)
  const theirAssets = context.theirAssets.sort((a, b) => b.composite - a.composite)

  // Find complementary positions
  const mySurplus = context.myBenchmark.surplus
  const theirNeeds = context.opponentBenchmark.needs
  const myNeeds = context.myBenchmark.needs
  const theirSurplus = context.opponentBenchmark.surplus

  // Proposal 1: Direct position swap
  for (const position of mySurplus) {
    if (theirNeeds.includes(position)) {
      const myAsset = myAssets.find(a => a.position === position)
      const theirAsset = theirAssets.find(a => a.position === position)

      if (myAsset && theirAsset) {
        const proposal = createProposal(
          'balanced',
          [myAsset.id],
          [theirAsset.id],
          context,
          `Balanced ${position} swap`
        )
        if (proposal) proposals.push(proposal)
      }
    }
  }

  // Proposal 2: Asset + pick for asset
  if (myAssets.length > 0 && theirAssets.length > 0) {
    const myAsset = myAssets[0]
    const theirAsset = theirAssets[0]
    const delta = Math.abs(myAsset.composite - theirAsset.composite)

    if (delta > 5) {
      // Add a pick to balance
      const pickValue = delta * 0.3 // Estimate pick value
      const suitablePick = findSuitablePick(pickValue, context.myPicks)

      if (suitablePick) {
        const proposal = createProposal(
          'balanced',
          [myAsset.id, suitablePick],
          [theirAsset.id],
          context,
          'Asset + pick for balanced trade'
        )
        if (proposal) proposals.push(proposal)
      }
    }
  }

  return proposals
}

function createProposal(
  type: 'win-now' | 'balanced' | 'future-lean',
  myAssets: string[],
  theirAssets: string[],
  context: ProposalContext,
  description: string
): TradeProposal | null {
  try {
    // Calculate composite values
    const myValue = myAssets.reduce((sum, assetId) => {
      if (assetId.includes('-')) {
        // It's a pick
        return sum + estimatePickValue(assetId)
      } else {
        // It's a player
        const asset = context.myAssets.find(a => a.id === assetId)
        return sum + (asset?.composite || 0)
      }
    }, 0)

    const theirValue = theirAssets.reduce((sum, assetId) => {
      if (assetId.includes('-')) {
        // It's a pick
        return sum + estimatePickValue(assetId)
      } else {
        // It's a player
        const asset = context.theirAssets.find(a => a.id === assetId)
        return sum + (asset?.composite || 0)
      }
    }, 0)

    const delta = Math.abs(myValue - theirValue) / Math.max(myValue, theirValue) * 100

    // Check constraints
    const warnings: string[] = []
    let isViable = true

    if (delta > 15) {
      isViable = false
      warnings.push('Trade is too lopsided (>15% difference)')
    }

    if (myAssets.length > 3 || theirAssets.length > 3) {
      isViable = false
      warnings.push('Too many assets (max 3 per side)')
    }

    // Check for critical gaps
    if (wouldCreateCriticalGap(myAssets, context.myBenchmark, context.leagueSettings)) {
      isViable = false
      warnings.push('Would create critical roster gap')
    }

    if (wouldCreateCriticalGap(theirAssets, context.opponentBenchmark, context.leagueSettings)) {
      isViable = false
      warnings.push('Would create critical gap for opponent')
    }

    const verdict = myValue > theirValue ? 
      `Favors you by ${delta.toFixed(1)}%` : 
      `Favors them by ${delta.toFixed(1)}%`

    return {
      id: `${type}-${Date.now()}`,
      type,
      myAssets,
      theirAssets,
      verdict,
      delta,
      rationale: generateRationale(type, myAssets, theirAssets, context),
      isViable,
      warnings
    }

  } catch (error) {
    console.error('Error creating proposal:', error)
    return null
  }
}

function generateRationale(
  type: string,
  myAssets: string[],
  theirAssets: string[],
  context: ProposalContext
): { myBenefits: string[]; theirBenefits: string[] } {
  const myBenefits: string[] = []
  const theirBenefits: string[] = []

  if (type === 'win-now') {
    myBenefits.push('Gets veteran contributors for championship push')
    myBenefits.push('Addresses immediate roster needs')
    theirBenefits.push('Receives future assets for rebuild')
    theirBenefits.push('Gains draft capital and young talent')
  } else if (type === 'future-lean') {
    myBenefits.push('Acquires future assets and draft picks')
    myBenefits.push('Builds for long-term success')
    theirBenefits.push('Gets veteran contributors for win-now')
    theirBenefits.push('Addresses immediate roster needs')
  } else {
    myBenefits.push('Balanced trade with fair value exchange')
    myBenefits.push('Addresses positional needs')
    theirBenefits.push('Balanced trade with fair value exchange')
    theirBenefits.push('Addresses positional needs')
  }

  return { myBenefits, theirBenefits }
}

function wouldCreateCriticalGap(
  assets: string[],
  benchmark: any,
  settings: LeagueSettings
): boolean {
  // Simplified check - would need more sophisticated analysis
  // For now, just check if we're trading away too many assets at one position
  const positionCounts: Record<string, number> = {}
  
  // This would need to be implemented with actual player data
  // For now, return false as a placeholder
  return false
}

function estimatePickValue(pickId: string): number {
  // Simplified pick valuation
  const [year, round] = pickId.split('-')
  const yearNum = parseInt(year)
  const roundNum = parseInt(round)
  
  const currentYear = new Date().getFullYear()
  const yearsOut = yearNum - currentYear
  
  let baseValue = 100 - (roundNum - 1) * 15 // 1st = 100, 2nd = 85, etc.
  baseValue *= Math.pow(0.9, yearsOut) // 10% discount per year
  
  return Math.max(baseValue, 10) // Minimum value of 10
}

function findSuitablePick(targetValue: number, picks: string[]): string | null {
  // Find a pick closest to the target value
  let bestPick: string | null = null
  let bestDiff = Infinity

  for (const pick of picks) {
    const value = estimatePickValue(pick)
    const diff = Math.abs(value - targetValue)
    
    if (diff < bestDiff) {
      bestDiff = diff
      bestPick = pick
    }
  }

  return bestPick
}

async function getTeamBenchmark(teamId: string, leagueId: string): Promise<any> {
  // This would typically call the benchmark API
  // For now, return a simplified structure
  return {
    surplus: ['WR', 'RB'],
    needs: ['QB'],
    flags: {
      criticalGaps: [],
      thinDepth: []
    }
  }
}
