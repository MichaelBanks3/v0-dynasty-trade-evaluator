import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const FAIRNESS_THRESHOLD = 50

export async function POST(request: NextRequest) {
  try {
    const { teamA, teamB } = await request.json()

    // Validate input
    if (!Array.isArray(teamA) || !Array.isArray(teamB)) {
      return NextResponse.json({ error: 'Invalid input format' }, { status: 400 })
    }

    if (teamA.length === 0 && teamB.length === 0) {
      return NextResponse.json({ error: 'At least one team must have players' }, { status: 400 })
    }

    // Get players from database
    const allPlayerIds = [...new Set([...teamA, ...teamB])]
    const players = await prisma.player.findMany({
      where: { id: { in: allPlayerIds } }
    })

    const playerMap = new Map(players.map(p => [p.id, p]))

    // Calculate totals
    const totalA = teamA.reduce((sum, id) => sum + (playerMap.get(id)?.value || 0), 0)
    const totalB = teamB.reduce((sum, id) => sum + (playerMap.get(id)?.value || 0), 0)
    const diff = Math.abs(totalA - totalB)

    // Determine verdict
    let verdict: string
    if (diff <= FAIRNESS_THRESHOLD) {
      verdict = 'FAIR'
    } else {
      verdict = totalA > totalB ? 'FAVORS_A' : 'FAVORS_B'
    }

    // Get player details for response
    const teamAPlayers = teamA.map(id => playerMap.get(id)).filter(Boolean)
    const teamBPlayers = teamB.map(id => playerMap.get(id)).filter(Boolean)

    const result = {
      totalA,
      totalB,
      verdict,
      teamAPlayers,
      teamBPlayers,
      saved: false
    }

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

        await prisma.trade.create({
          data: {
            userId,
            sideAPlayerIds: teamA.map(String),
            sideBPlayerIds: teamB.map(String),
            totalA,
            totalB,
            verdict
          }
        })
        result.saved = true
      } catch (dbError) {
        console.error('Failed to save trade:', dbError)
        // Continue without saving
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Evaluation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}