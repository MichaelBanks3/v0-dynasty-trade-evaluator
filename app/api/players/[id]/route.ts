import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Try to find player by ID
    const player = await prisma.player.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        position: true,
        team: true,
        age: true,
        sleeperId: true
      }
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    return NextResponse.json(player)

  } catch (error) {
    console.error('Error fetching player:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
