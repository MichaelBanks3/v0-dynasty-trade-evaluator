import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { LeagueSettings, DEFAULT_SETTINGS, validateSettings } from '@/lib/settings'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    // For anonymous users, return a default/empty profile
    return NextResponse.json({
      timeline: "contend",
      riskTolerance: "medium",
      roster: [],
      ownedPicks: [],
      leagueSettings: DEFAULT_SETTINGS,
      isAnonymous: true,
    });
  }

  try {
    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    })

    const profile = await prisma.teamProfile.findUnique({
      where: { userId }
    })

    if (!profile) {
      return NextResponse.json({ profile: null })
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        timeline: profile.timeline,
        riskTolerance: profile.riskTolerance,
        leagueSettings: profile.leagueSettings ? JSON.parse(profile.leagueSettings as string) : null,
        roster: JSON.parse(profile.roster as string),
        ownedPicks: JSON.parse(profile.ownedPicks as string),
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      }
    })
  } catch (error) {
    console.error('Error fetching team profile:', error)
    return NextResponse.json({ error: 'Failed to fetch team profile' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { timeline, riskTolerance, leagueSettings, roster, ownedPicks, leagueId, teamId } = body

    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    })

    // Handle league import if provided
    let finalRoster = roster || []
    let finalOwnedPicks = ownedPicks || []
    let finalSettings = leagueSettings

    if (leagueId && teamId) {
      // Get league team roster
      const leagueTeam = await prisma.leagueTeam.findUnique({
        where: { id: teamId },
        include: {
          roster: true,
          picks: true,
          league: true
        }
      })

      if (leagueTeam && leagueTeam.roster) {
        // Use imported roster
        finalRoster = JSON.parse(leagueTeam.roster.playerIds as string)
        
        // Use imported picks
        finalOwnedPicks = leagueTeam.picks.map(pick => `${pick.year}-${pick.round}`)
        
        // Use league settings if available
        if (leagueTeam.league.settingsSnapshot) {
          finalSettings = JSON.parse(leagueTeam.league.settingsSnapshot as string)
        }
      }
    }

    // Validate inputs
    const validTimeline = ['contend', 'retool', 'rebuild'].includes(timeline) ? timeline : 'contend'
    const validRiskTolerance = ['low', 'medium', 'high'].includes(riskTolerance) ? riskTolerance : 'medium'
    const validatedSettings = finalSettings ? validateSettings(finalSettings) : null

    const profile = await prisma.teamProfile.upsert({
      where: { userId },
      update: {
        timeline: validTimeline,
        riskTolerance: validRiskTolerance,
        leagueSettings: validatedSettings ? JSON.stringify(validatedSettings) : null,
        roster: JSON.stringify(finalRoster),
        ownedPicks: JSON.stringify(finalOwnedPicks)
      },
      create: {
        userId,
        timeline: validTimeline,
        riskTolerance: validRiskTolerance,
        leagueSettings: validatedSettings ? JSON.stringify(validatedSettings) : null,
        roster: JSON.stringify(finalRoster),
        ownedPicks: JSON.stringify(finalOwnedPicks)
      }
    })

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        timeline: profile.timeline,
        riskTolerance: profile.riskTolerance,
        leagueSettings: profile.leagueSettings ? JSON.parse(profile.leagueSettings as string) : null,
        roster: JSON.parse(profile.roster as string),
        ownedPicks: JSON.parse(profile.ownedPicks as string),
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      }
    })
  } catch (error) {
    console.error('Error saving team profile:', error)
    return NextResponse.json({ error: 'Failed to save team profile' }, { status: 500 })
  }
}
