import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  getBestLineup, 
  getDepthCoverage, 
  getRosterFlags, 
  getTeamIndices,
  analyzeTradeImpact
} from '@/lib/roster-analysis'
import { LeagueSettings, DEFAULT_SETTINGS, validateSettings } from '@/lib/settings'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface TeamBenchmark {
  teamId: string
  displayName: string
  userHandle: string | null
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
  rank: {
    now: number
    future: number
  }
  percentile: {
    now: number
    future: number
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  const startTime = Date.now()
  
  try {
    const { leagueId } = params

    // Get league with teams and rosters
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
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Parse league settings
    let leagueSettings: LeagueSettings = DEFAULT_SETTINGS
    if (league.settingsSnapshot) {
      try {
        leagueSettings = validateSettings(JSON.parse(league.settingsSnapshot as string))
      } catch (error) {
        console.warn('Failed to parse league settings, using defaults:', error)
      }
    }

    // Get all players for the league
    const allPlayerIds = new Set<string>()
    league.teams.forEach(team => {
      if (team.roster) {
        const playerIds = JSON.parse(team.roster.playerIds as string) as string[]
        playerIds.forEach(id => allPlayerIds.add(id))
      }
    })

    // Get player data and valuations
    const players = await prisma.player.findMany({
      where: { id: { in: Array.from(allPlayerIds) } },
      include: {
        valuations: {
          where: {
            settingsHash: JSON.stringify(leagueSettings)
          }
        }
      }
    })

    // Create player lookup map
    const playerMap = new Map()
    players.forEach(player => {
      const valuation = player.valuations[0]
      if (valuation) {
        playerMap.set(player.id, {
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.team,
          age: player.age,
          status: player.status,
          nowScore: valuation.nowScore,
          futureScore: valuation.futureScore,
          composite: valuation.composite
        })
      }
    })

    // Benchmark each team
    const benchmarks: TeamBenchmark[] = []
    
    for (const team of league.teams) {
      if (!team.roster) continue

      const playerIds = JSON.parse(team.roster.playerIds as string) as string[]
      const teamPlayers = playerIds
        .map(id => playerMap.get(id))
        .filter(Boolean)

      if (teamPlayers.length === 0) continue

      // Create team profile for analysis
      const teamProfile = {
        timeline: 'contend' as const,
        riskTolerance: 'medium' as const,
        leagueSettings,
        roster: playerIds,
        ownedPicks: team.picks.map(pick => `${pick.year}-${pick.round}`)
      }

      // Analyze team
      const analysis = await analyzeTradeImpact(teamProfile, [], [])
      const { preTrade } = analysis

      // Calculate surplus/needs
      const surplus: string[] = []
      const needs: string[] = []
      
      Object.entries(preTrade.depthCoverage).forEach(([position, coverage]) => {
        const starters = leagueSettings.starters[position as keyof typeof leagueSettings.starters] || 0
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
        displayName: team.displayName,
        userHandle: team.userHandle,
        nowIndex: preTrade.indices.nowIndex,
        futureIndex: preTrade.indices.futureIndex,
        depthCoverage: preTrade.depthCoverage,
        flags: preTrade.flags,
        surplus,
        needs,
        rank: { now: 0, future: 0 }, // Will be calculated below
        percentile: { now: 0, future: 0 } // Will be calculated below
      })
    }

    // Calculate rankings and percentiles
    const nowIndices = benchmarks.map(b => b.nowIndex).sort((a, b) => b - a)
    const futureIndices = benchmarks.map(b => b.futureIndex).sort((a, b) => b - a)

    benchmarks.forEach(benchmark => {
      // Now ranking (higher is better)
      benchmark.rank.now = nowIndices.indexOf(benchmark.nowIndex) + 1
      benchmark.percentile.now = Math.round(((benchmarks.length - benchmark.rank.now + 1) / benchmarks.length) * 100)
      
      // Future ranking (higher is better)
      benchmark.rank.future = futureIndices.indexOf(benchmark.futureIndex) + 1
      benchmark.percentile.future = Math.round(((benchmarks.length - benchmark.rank.future + 1) / benchmarks.length) * 100)
    })

    const duration = Date.now() - startTime

    // Track benchmark generation
    await trackEvent('league_benchmark_view', {
      payloadHash: generatePayloadHash({ 
        leagueId: leagueId.substring(0, 8),
        teamCount: benchmarks.length
      }),
      durationMs: duration
    })

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        season: league.season,
        settings: leagueSettings
      },
      benchmarks,
      stats: {
        totalTeams: benchmarks.length,
        avgNowIndex: Math.round(benchmarks.reduce((sum, b) => sum + b.nowIndex, 0) / benchmarks.length),
        avgFutureIndex: Math.round(benchmarks.reduce((sum, b) => sum + b.futureIndex, 0) / benchmarks.length),
        duration
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('Error benchmarking league:', error)
    
    return NextResponse.json({ 
      error: 'Failed to benchmark league',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
