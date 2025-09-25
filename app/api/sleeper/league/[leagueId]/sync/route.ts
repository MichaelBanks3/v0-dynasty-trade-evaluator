import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { computePowerIndex, LeagueTeam } from '@/lib/powerIndex'

export async function POST(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leagueId } = params

    // Get user's Sleeper info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { sleeperUserId: true }
    })

    if (!user?.sleeperUserId) {
      return NextResponse.json({ error: 'Sleeper account not connected' }, { status: 400 })
    }

    // Fetch league data from Sleeper API
    const [leagueResponse, rostersResponse, usersResponse] = await Promise.all([
      fetch(`https://api.sleeper.app/v1/league/${leagueId}`),
      fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
      fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`)
    ])

    if (!leagueResponse.ok || !rostersResponse.ok || !usersResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch league data' }, { status: 500 })
    }

    const [league, rosters, users] = await Promise.all([
      leagueResponse.json(),
      rostersResponse.json(),
      usersResponse.json()
    ])

    // Find user's roster
    const userRoster = rosters.find((r: any) => r.owner_id === user.sleeperUserId)
    if (!userRoster) {
      return NextResponse.json({ error: 'User not found in league' }, { status: 404 })
    }

    // Calculate power index
    const leagueTeams: LeagueTeam[] = rosters.map((roster: any) => ({
      id: roster.roster_id,
      roster: {
        starters: roster.starters || [],
        bench: roster.reserve || []
      },
      wins: roster.settings?.wins || 0,
      losses: roster.settings?.losses || 0,
      pointsFor: roster.settings?.fpts || 0,
      pointsAgainst: roster.settings?.fpts_against || 0,
    }))

    const powerIndex = computePowerIndex(userRoster.roster_id, leagueTeams)

    // Store power index snapshot
    await prisma.powerIndexSnapshot.create({
      data: {
        userId: user.clerkId,
        leagueId: leagueId,
        score: powerIndex.score,
        rank: powerIndex.rank,
      }
    })

    return NextResponse.json({
      success: true,
      powerIndex,
      league: {
        name: league.name,
        season: league.season,
        totalTeams: rosters.length
      }
    })

  } catch (error) {
    console.error('League sync error:', error)
    return NextResponse.json({ error: 'Failed to sync league' }, { status: 500 })
  }
}
