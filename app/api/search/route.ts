import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface SearchResult {
  id: string
  type: 'player' | 'pick'
  label: string
  value?: number
  meta?: {
    position?: string
    team?: string
    age?: number
    status?: string
    year?: number
    round?: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    
    if (!query || query.length < 1) {
      return NextResponse.json([])
    }
    
    const results: SearchResult[] = []
    
    // Get all players and filter client-side (like the working players API)
    const allPlayers = await prisma.player.findMany({
      orderBy: [
        { value: 'desc' },
        { name: 'asc' }
      ]
    })
    
    // Filter players client-side
    const lowerQuery = query.toLowerCase()
    const filteredPlayers = allPlayers.filter(player => 
      player.name.toLowerCase().includes(lowerQuery) ||
      (player.team && player.team.toLowerCase().includes(lowerQuery)) ||
      player.position.toLowerCase().includes(lowerQuery)
    ).slice(0, 20) // Limit for performance
    
    // Convert players to search results
    for (const player of filteredPlayers) {
      // Get the composite value from valuation
      const valuation = await prisma.valuation.findFirst({
        where: {
          playerId: player.id,
          scoring: 'PPR',
          superflex: false,
          tePremium: 1.0
        }
      })
      
      results.push({
        id: `player:${player.id}`,
        type: 'player',
        label: player.name,
        value: valuation?.compositeValue || player.value || 0,
        meta: {
          position: player.position,
          team: player.team || undefined,
          age: player.age || undefined,
          status: player.status || 'ACTIVE'
        }
      })
    }
    
    // Get all picks and filter client-side
    try {
      const allPicks = await prisma.pick.findMany({
        orderBy: [
          { year: 'asc' },
          { round: 'asc' }
        ]
      })
      
      // Filter picks client-side
      const filteredPicks = allPicks.filter(pick => 
        pick.label.toLowerCase().includes(lowerQuery) ||
        pick.year.toString().includes(query) ||
        pick.round.toString().includes(query)
      ).slice(0, 10)
      
    // Convert picks to search results
    for (const pick of filteredPicks) {
      results.push({
        id: `pick:${pick.id}`,
        type: 'pick',
        label: pick.label,
        value: pick.compositeValue || pick.baselineValue,
        meta: {
          year: pick.year,
          round: pick.round
        }
      })
    }
    } catch (pickError) {
      console.warn('Error fetching picks:', pickError)
      // Continue without picks
    }
    
    // Sort results: players first, then picks
    results.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'player' ? -1 : 1
      }
      return a.label.localeCompare(b.label)
    })
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Search API error:', error)
    console.error('Error details:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
