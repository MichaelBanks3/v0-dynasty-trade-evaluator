import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const { leagueId } = params

    // Get league with teams and rosters
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        teams: {
          include: {
            roster: true
          }
        },
        picks: true
      }
    })

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Calculate import stats
    const teams = league.teams
    const totalPlayers = teams.reduce((sum, team) => {
      const roster = team.roster
      if (roster) {
        const playerIds = JSON.parse(roster.playerIds as string) as string[]
        const unmatchedIds = JSON.parse(roster.unmatchedIds as string) as string[]
        return sum + playerIds.length + unmatchedIds.length
      }
      return sum
    }, 0)

    const matchedPlayers = teams.reduce((sum, team) => {
      const roster = team.roster
      if (roster) {
        const playerIds = JSON.parse(roster.playerIds as string) as string[]
        return sum + playerIds.length
      }
      return sum
    }, 0)

    const unmatchedPlayers = totalPlayers - matchedPlayers

    // Parse settings snapshot
    let settingsSnapshot = null
    if (league.settingsSnapshot) {
      try {
        settingsSnapshot = JSON.parse(league.settingsSnapshot as string)
      } catch (error) {
        console.warn('Failed to parse settings snapshot:', error)
      }
    }

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        season: league.season,
        settingsSnapshot
      },
      teams: teams.map(team => {
        const roster = team.roster
        const playerCount = roster ? 
          (JSON.parse(roster.playerIds as string) as string[]).length : 0
        const unmatchedCount = roster ? 
          (JSON.parse(roster.unmatchedIds as string) as string[]).length : 0

        return {
          id: team.id,
          displayName: team.displayName,
          userHandle: team.userHandle,
          playerCount,
          unmatchedCount
        }
      }),
      stats: {
        totalTeams: teams.length,
        totalPlayers,
        matchedPlayers,
        unmatchedPlayers,
        matchRate: totalPlayers > 0 ? Math.round((matchedPlayers / totalPlayers) * 100) : 0,
        hasPicks: league.picks.length > 0,
        lastSyncedAt: league.lastSyncedAt
      }
    })

  } catch (error) {
    console.error('Error fetching league summary:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch league summary' 
    }, { status: 500 })
  }
}
