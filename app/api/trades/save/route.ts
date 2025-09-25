import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { generateTradeSlug } from '@/lib/slug'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface SaveTradeRequest {
  teamA: string[]
  teamB: string[]
  settings: any
  evaluationResult: any
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SaveTradeRequest = await request.json()
    const { teamA, teamB, settings, evaluationResult } = body

    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    })

    // Generate unique slug
    const slug = generateTradeSlug()

    // Save trade with full evaluation snapshot
    const trade = await prisma.trade.create({
      data: {
        userId,
        slug,
        teamA: JSON.stringify(teamA),
        teamB: JSON.stringify(teamB),
        settings: JSON.stringify(settings),
        verdict: evaluationResult.verdict,
        nowDelta: evaluationResult.totals.teamA.compositeValue - evaluationResult.totals.teamB.compositeValue,
        futureDelta: evaluationResult.totals.teamA.futureScore - evaluationResult.totals.teamB.futureScore,
        breakdown: JSON.stringify(evaluationResult.assets),
        evaluationSnapshot: JSON.stringify(evaluationResult),
        // Legacy fields for backward compatibility
        sideAPlayerIds: teamA.filter(id => id.startsWith('player:')).map(id => id.replace('player:', '')),
        sideBPlayerIds: teamB.filter(id => id.startsWith('player:')).map(id => id.replace('player:', '')),
        totalA: evaluationResult.totals.teamA.compositeValue,
        totalB: evaluationResult.totals.teamB.compositeValue
      }
    })

    return NextResponse.json({ 
      success: true, 
      slug: trade.slug,
      id: trade.id 
    })

  } catch (error) {
    console.error('Error saving trade:', error)
    return NextResponse.json({ error: 'Failed to save trade' }, { status: 500 })
  }
}