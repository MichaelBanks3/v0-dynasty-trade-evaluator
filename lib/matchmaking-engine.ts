import { LeagueSettings } from './settings'
import { prisma } from './db'
import { 
  getBestLineup, 
  getDepthCoverage, 
  getRosterFlags, 
  getTeamIndices,
  analyzeTradeImpact,
  type TeamProfile
} from './roster-analysis'

export interface MatchmakingResult {
  opponentId: string
  displayName: string
  userHandle: string | null
  compatibilityScore: number // 0-100
  topPositions: {
    give: string[] // positions we can give
    get: string[]  // positions we can get
  }
  timelineNote: string
  surplusComplement: Record<string, number> // position -> complement score
  needsComplement: Record<string, number>   // position -> complement score
}

export interface MatchmakingContext {
  myTeamId: string
  myTeamProfile: TeamProfile
  leagueId: string
  leagueSettings: LeagueSettings
  allTeams: Array<{
    id: string
    displayName: string
    userHandle: string | null
    roster: string[]
    picks: string[]
  }>
  teamBenchmarks: Array<{
    teamId: string
    nowIndex: number
    futureIndex: number
    depthCoverage: Record<string, number>
    flags: {
      qbGap: boolean
      thinDepth: { position: string; coverage: number }[]
      criticalGaps: string[]
      riskFlags: string[]
      ageSkew: string[]
    }
    surplus: string[]
    needs: string[]
  }>
}

export async function computeMatchmaking(
  myTeamId: string,
  leagueId: string,
  objective: 'win-now' | 'balanced' | 'future-lean' = 'balanced'
): Promise<MatchmakingResult[]> {
  try {
    // Get league and team data
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        teams: {
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

    // Parse league settings
    let leagueSettings: LeagueSettings
    if (league.settingsSnapshot) {
      try {
        leagueSettings = JSON.parse(league.settingsSnapshot as string)
      } catch (error) {
        throw new Error('Invalid league settings')
      }
    } else {
      throw new Error('No league settings found')
    }

    // Get my team profile
    const myTeam = league.teams.find(t => t.id === myTeamId)
    if (!myTeam || !myTeam.roster) {
      throw new Error('My team not found or has no roster')
    }

    // Create my team profile
    const myTeamProfile: TeamProfile = {
      timeline: 'contend', // Will be determined by objective
      riskTolerance: 'medium',
      leagueSettings,
      roster: JSON.parse(myTeam.roster.playerIds as string),
      ownedPicks: myTeam.picks.map(pick => `${pick.year}-${pick.round}`)
    }

    // Get all team benchmarks
    const teamBenchmarks = await getTeamBenchmarks(leagueId)

    // Create matchmaking context
    const context: MatchmakingContext = {
      myTeamId,
      myTeamProfile,
      leagueId,
      leagueSettings,
      allTeams: league.teams.map(team => ({
        id: team.id,
        displayName: team.displayName,
        userHandle: team.userHandle,
        roster: team.roster ? JSON.parse(team.roster.playerIds as string) : [],
        picks: team.picks.map(pick => `${pick.year}-${pick.round}`)
      })),
      teamBenchmarks
    }

    // Find my team's benchmark
    const myBenchmark = teamBenchmarks.find(b => b.teamId === myTeamId)
    if (!myBenchmark) {
      throw new Error('My team benchmark not found')
    }

    // Compute compatibility scores for all opponents
    const results: MatchmakingResult[] = []

    for (const opponent of context.allTeams) {
      if (opponent.id === myTeamId) continue // Skip self

      const opponentBenchmark = teamBenchmarks.find(b => b.teamId === opponent.id)
      if (!opponentBenchmark) continue

      const compatibility = computeCompatibilityScore(
        myBenchmark,
        opponentBenchmark,
        objective,
        leagueSettings
      )

      if (compatibility.score > 20) { // Only include teams with meaningful compatibility
        results.push({
          opponentId: opponent.id,
          displayName: opponent.displayName,
          userHandle: opponent.userHandle,
          compatibilityScore: compatibility.score,
          topPositions: compatibility.positions,
          timelineNote: compatibility.timelineNote,
          surplusComplement: compatibility.surplusComplement,
          needsComplement: compatibility.needsComplement
        })
      }
    }

    // Sort by compatibility score and return top 5
    return results
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 5)

  } catch (error) {
    console.error('Error in matchmaking:', error)
    throw error
  }
}

async function getTeamBenchmarks(leagueId: string) {
  // This would typically call the benchmark API or use cached data
  // For now, we'll simulate the structure
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      teams: {
        include: {
          roster: true
        }
      }
    }
  })

  if (!league) return []

  const benchmarks = []
  for (const team of league.teams) {
    if (!team.roster) continue

    const playerIds = JSON.parse(team.roster.playerIds as string) as string[]
    
    // Get player data for analysis
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      include: {
        valuations: {
          where: {
            settingsHash: JSON.stringify(JSON.parse(league.settingsSnapshot as string))
          }
        }
      }
    })

    // Create team profile for analysis
    const teamProfile: TeamProfile = {
      timeline: 'contend',
      riskTolerance: 'medium',
      leagueSettings: JSON.parse(league.settingsSnapshot as string),
      roster: playerIds,
      ownedPicks: []
    }

    // Analyze team
    const analysis = await analyzeTradeImpact(teamProfile, [], [])
    const { preTrade } = analysis

    // Calculate surplus/needs
    const surplus: string[] = []
    const needs: string[] = []
    
    Object.entries(preTrade.depthCoverage).forEach(([position, coverage]) => {
      const starters = teamProfile.leagueSettings.starters[position as keyof typeof teamProfile.leagueSettings.starters] || 0
      if (starters > 0) {
        if (coverage >= starters * 1.5) {
          surplus.push(position)
        } else if (coverage < starters * 0.5 || coverage === 0) {
          needs.push(position)
        }
      }
    })

    benchmarks.push({
      teamId: team.id,
      nowIndex: preTrade.indices.nowIndex,
      futureIndex: preTrade.indices.futureIndex,
      depthCoverage: preTrade.depthCoverage,
      flags: preTrade.flags,
      surplus,
      needs
    })
  }

  return benchmarks
}

function computeCompatibilityScore(
  myBenchmark: any,
  opponentBenchmark: any,
  objective: 'win-now' | 'balanced' | 'future-lean',
  settings: LeagueSettings
): {
  score: number
  positions: { give: string[]; get: string[] }
  timelineNote: string
  surplusComplement: Record<string, number>
  needsComplement: Record<string, number>
} {
  let score = 0
  const surplusComplement: Record<string, number> = {}
  const needsComplement: Record<string, number> = {}
  const givePositions: string[] = []
  const getPositions: string[] = []

  // Position complementarity scoring
  const positions = ['QB', 'RB', 'WR', 'TE']
  
  for (const position of positions) {
    const mySurplus = myBenchmark.surplus.includes(position)
    const myNeed = myBenchmark.needs.includes(position)
    const theirSurplus = opponentBenchmark.surplus.includes(position)
    const theirNeed = opponentBenchmark.needs.includes(position)

    // Perfect complement: I have surplus, they have need
    if (mySurplus && theirNeed) {
      const complementScore = 25 // High value
      surplusComplement[position] = complementScore
      givePositions.push(position)
      score += complementScore
    }

    // Perfect complement: They have surplus, I have need
    if (theirSurplus && myNeed) {
      const complementScore = 25 // High value
      needsComplement[position] = complementScore
      getPositions.push(position)
      score += complementScore
    }

    // Partial complement: Both have surplus or both have need (can still trade)
    if ((mySurplus && theirSurplus) || (myNeed && theirNeed)) {
      const complementScore = 10 // Lower value
      if (mySurplus) {
        surplusComplement[position] = complementScore
        givePositions.push(position)
      }
      if (myNeed) {
        needsComplement[position] = complementScore
        getPositions.push(position)
      }
      score += complementScore
    }
  }

  // Timeline compatibility
  const myNowIndex = myBenchmark.nowIndex
  const myFutureIndex = myBenchmark.futureIndex
  const theirNowIndex = opponentBenchmark.nowIndex
  const theirFutureIndex = opponentBenchmark.futureIndex

  let timelineNote = ''
  let timelineScore = 0

  if (objective === 'win-now') {
    // I want to win now, they want future
    if (theirFutureIndex > theirNowIndex) {
      timelineScore = 20
      timelineNote = 'They\'re rebuilding, you\'re contending - perfect match'
    } else if (theirNowIndex > theirFutureIndex) {
      timelineScore = 5
      timelineNote = 'Both contending - may need to overpay'
    } else {
      timelineScore = 10
      timelineNote = 'Neutral timeline fit'
    }
  } else if (objective === 'future-lean') {
    // I want future, they want now
    if (theirNowIndex > theirFutureIndex) {
      timelineScore = 20
      timelineNote = 'You\'re rebuilding, they\'re contending - perfect match'
    } else if (theirFutureIndex > theirNowIndex) {
      timelineScore = 5
      timelineNote = 'Both rebuilding - may need to overpay'
    } else {
      timelineScore = 10
      timelineNote = 'Neutral timeline fit'
    }
  } else {
    // Balanced - any timeline works
    timelineScore = 15
    timelineNote = 'Balanced approach works with any timeline'
  }

  score += timelineScore

  // Risk tolerance adjustment (simplified)
  // If opponent has critical gaps, reduce score
  if (opponentBenchmark.flags.criticalGaps.length > 0) {
    score -= 10
  }

  // Cap score at 100
  score = Math.min(score, 100)

  return {
    score,
    positions: {
      give: givePositions,
      get: getPositions
    },
    timelineNote,
    surplusComplement,
    needsComplement
  }
}
