import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { 
  fetchSleeperLeague, 
  fetchSleeperRosters, 
  fetchSleeperUsers, 
  fetchSleeperTradedPicks,
  detectLeagueSettings,
  mapSleeperPlayers
} from '@/lib/sleeper-api'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const { userId } = auth()

  try {
    const body = await request.json()
    const { leagueId } = body

    if (!leagueId || typeof leagueId !== 'string') {
      return NextResponse.json({ error: 'Invalid league ID' }, { status: 400 })
    }

    // Track import start
    await trackEvent('league_import_start', {
      userId,
      payloadHash: generatePayloadHash({ leagueId: leagueId.substring(0, 8) })
    })

    // Fetch league data from Sleeper
    const [league, rosters, users, tradedPicks] = await Promise.all([
      fetchSleeperLeague(leagueId),
      fetchSleeperRosters(leagueId),
      fetchSleeperUsers(leagueId),
      fetchSleeperTradedPicks(leagueId)
    ])

    // Detect league settings
    const settingsSnapshot = detectLeagueSettings(league)

    // Upsert league
    const dbLeague = await prisma.league.upsert({
      where: { sleeperId: leagueId },
      update: {
        name: league.name,
        season: league.season,
        settingsSnapshot: JSON.stringify(settingsSnapshot),
        lastSyncedAt: new Date()
      },
      create: {
        sleeperId: leagueId,
        name: league.name,
        season: league.season,
        settingsSnapshot: JSON.stringify(settingsSnapshot),
        lastSyncedAt: new Date()
      }
    })

    // Create user lookup map
    const userMap = new Map(users.map(user => [user.user_id, user]))

    // Process teams and rosters
    const teamResults = []
    let totalPlayers = 0
    let matchedPlayers = 0
    let unmatchedPlayers = 0

    for (const roster of rosters) {
      const user = userMap.get(roster.owner_id)
      const displayName = user?.display_name || user?.username || `Team ${roster.roster_id}`
      const userHandle = user?.username

      // Upsert team
      const dbTeam = await prisma.leagueTeam.upsert({
        where: {
          leagueId_sleeperId: {
            leagueId: dbLeague.id,
            sleeperId: roster.roster_id
          }
        },
        update: {
          displayName,
          userHandle,
          metadataJson: JSON.stringify(roster.metadata || {}),
          lastSyncedAt: new Date()
        },
        create: {
          leagueId: dbLeague.id,
          sleeperId: roster.roster_id,
          displayName,
          userHandle,
          metadataJson: JSON.stringify(roster.metadata || {}),
          lastSyncedAt: new Date()
        }
      })

      // Map player IDs
      const playerMapping = await mapSleeperPlayers(roster.players || [])
      
      totalPlayers += roster.players?.length || 0
      matchedPlayers += playerMapping.mapped.length
      unmatchedPlayers += playerMapping.unmatched.length

      // Upsert roster
      await prisma.leagueRoster.upsert({
        where: { leagueTeamId: dbTeam.id },
        update: {
          playerIds: JSON.stringify(playerMapping.mapped),
          unmatchedIds: JSON.stringify(playerMapping.unmatched),
          lastSyncedAt: new Date()
        },
        create: {
          leagueTeamId: dbTeam.id,
          playerIds: JSON.stringify(playerMapping.mapped),
          unmatchedIds: JSON.stringify(playerMapping.unmatched),
          lastSyncedAt: new Date()
        }
      })

      teamResults.push({
        id: dbTeam.id,
        displayName,
        userHandle,
        playerCount: playerMapping.mapped.length,
        unmatchedCount: playerMapping.unmatched.length
      })
    }

    // Process traded picks if available
    if (tradedPicks.length > 0) {
      // Clear existing picks for this league
      await prisma.leaguePick.deleteMany({
        where: { leagueId: dbLeague.id }
      })

      // Create team lookup map
      const teamMap = new Map()
      const teams = await prisma.leagueTeam.findMany({
        where: { leagueId: dbLeague.id }
      })
      teams.forEach(team => {
        teamMap.set(team.sleeperId, team.id)
      })

      // Insert traded picks
      for (const pick of tradedPicks) {
        const ownerId = teamMap.get(pick.owner_id.toString())
        
        await prisma.leaguePick.create({
          data: {
            leagueId: dbLeague.id,
            ownerId,
            year: parseInt(pick.season),
            round: pick.round,
            originalOwner: pick.previous_owner_id?.toString()
          }
        })
      }
    }

    const duration = Date.now() - startTime

    // Track successful import
    await trackEvent('league_import_success', {
      userId,
      payloadHash: generatePayloadHash({ 
        leagueId: leagueId.substring(0, 8),
        teamCount: teamResults.length,
        matchRate: totalPlayers > 0 ? Math.round((matchedPlayers / totalPlayers) * 100) : 0
      }),
      durationMs: duration
    })

    return NextResponse.json({
      success: true,
      league: {
        id: dbLeague.id,
        name: dbLeague.name,
        season: dbLeague.season,
        settingsSnapshot
      },
      teams: teamResults,
      stats: {
        totalTeams: teamResults.length,
        totalPlayers,
        matchedPlayers,
        unmatchedPlayers,
        matchRate: totalPlayers > 0 ? Math.round((matchedPlayers / totalPlayers) * 100) : 0,
        hasPicks: tradedPicks.length > 0
      },
      duration
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('League import error:', error)

    // Track failed import
    await trackEvent('league_import_fail', {
      userId,
      payloadHash: generatePayloadHash({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      durationMs: duration
    })

    if (error instanceof Error) {
      if (error.message.includes('404')) {
        return NextResponse.json({ 
          error: 'League not found. Please check the league ID and ensure the league is public.' 
        }, { status: 404 })
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please try again in a few minutes.' 
        }, { status: 429 })
      }
    }

    return NextResponse.json({ 
      error: 'Failed to import league. Please try again or contact support if the issue persists.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
