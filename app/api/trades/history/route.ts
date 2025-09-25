import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's trades, ordered by most recent first
    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 trades
      select: {
        id: true,
        slug: true,
        verdict: true,
        nowDelta: true,
        futureDelta: true,
        totalA: true,
        totalB: true,
        settings: true,
        createdAt: true
      }
    })

    // Parse JSON fields
    const tradeHistory = trades.map(trade => ({
      id: trade.id,
      slug: trade.slug,
      verdict: trade.verdict,
      nowDelta: trade.nowDelta,
      futureDelta: trade.futureDelta,
      totalA: trade.totalA,
      totalB: trade.totalB,
      settings: JSON.parse(trade.settings as string),
      createdAt: trade.createdAt.toISOString()
    }))

    return NextResponse.json(tradeHistory)

  } catch (error) {
    console.error('Error fetching trade history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
