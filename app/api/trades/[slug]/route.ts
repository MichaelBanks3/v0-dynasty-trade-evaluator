import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isValidSlug } from '@/lib/slug'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid trade link' }, { status: 400 })
    }

    const trade = await prisma.trade.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    // Parse JSON fields
    const tradeData = {
      id: trade.id,
      slug: trade.slug,
      userId: trade.userId,
      teamA: JSON.parse(trade.teamA as string),
      teamB: JSON.parse(trade.teamB as string),
      settings: JSON.parse(trade.settings as string),
      verdict: trade.verdict,
      nowDelta: trade.nowDelta,
      futureDelta: trade.futureDelta,
      evaluationSnapshot: JSON.parse(trade.evaluationSnapshot as string),
      createdAt: trade.createdAt.toISOString(),
      user: trade.user
    }

    return NextResponse.json(tradeData)

  } catch (error) {
    console.error('Error fetching trade:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
