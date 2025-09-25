import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const season = searchParams.get('season') || '2024'

    // Get user's Sleeper info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { sleeperUserId: true }
    })

    if (!user?.sleeperUserId) {
      return NextResponse.json({ error: 'Sleeper account not connected' }, { status: 400 })
    }

    // Fetch leagues from Sleeper API
    const leaguesResponse = await fetch(`https://api.sleeper.app/v1/user/${user.sleeperUserId}/leagues/nfl/${season}`)
    if (!leaguesResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 })
    }

    const leagues = await leaguesResponse.json()

    // Upsert league links
    const leagueLinks = await Promise.all(
      leagues.map(async (league: any) => {
        return prisma.leagueLink.upsert({
          where: {
            userId_leagueId: {
              userId: user.clerkId,
              leagueId: league.league_id
            }
          },
          update: {
            name: league.name,
            season: league.season,
          },
          create: {
            userId: user.clerkId,
            leagueId: league.league_id,
            name: league.name,
            season: league.season,
            sport: 'nfl',
          },
        })
      })
    )

    return NextResponse.json({ 
      success: true, 
      leagues: leagueLinks,
      count: leagueLinks.length
    })

  } catch (error) {
    console.error('Sleeper leagues error:', error)
    return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 })
  }
}
