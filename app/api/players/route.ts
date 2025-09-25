import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Seed data for auto-population
const SEED_PLAYERS = [
  { name: "Josh Allen", position: "QB", team: "BUF", value: 95 },
  { name: "Lamar Jackson", position: "QB", team: "BAL", value: 92 },
  { name: "Patrick Mahomes", position: "QB", team: "KC", value: 98 },
  { name: "Dak Prescott", position: "QB", team: "DAL", value: 88 },
  { name: "Jalen Hurts", position: "QB", team: "PHI", value: 90 },
  { name: "Christian McCaffrey", position: "RB", team: "SF", value: 96 },
  { name: "Austin Ekeler", position: "RB", team: "LAC", value: 85 },
  { name: "Derrick Henry", position: "RB", team: "TEN", value: 82 },
  { name: "Saquon Barkley", position: "RB", team: "NYG", value: 87 },
  { name: "Nick Chubb", position: "RB", team: "CLE", value: 84 },
  { name: "Cooper Kupp", position: "WR", team: "LAR", value: 89 },
  { name: "Davante Adams", position: "WR", team: "LV", value: 91 },
  { name: "Tyreek Hill", position: "WR", team: "MIA", value: 88 },
  { name: "Stefon Diggs", position: "WR", team: "BUF", value: 86 },
  { name: "A.J. Brown", position: "WR", team: "PHI", value: 87 },
  { name: "Travis Kelce", position: "TE", team: "KC", value: 85 },
  { name: "Mark Andrews", position: "TE", team: "BAL", value: 78 },
  { name: "George Kittle", position: "TE", team: "SF", value: 76 },
  { name: "T.J. Hockenson", position: "TE", team: "MIN", value: 72 },
  { name: "Kyle Pitts", position: "TE", team: "ATL", value: 70 },
  { name: "CeeDee Lamb", position: "WR", team: "DAL", value: 88 },
  { name: "Ja'Marr Chase", position: "WR", team: "CIN", value: 90 },
  { name: "Justin Jefferson", position: "WR", team: "MIN", value: 92 },
  { name: "Amon-Ra St. Brown", position: "WR", team: "DET", value: 83 },
  { name: "Mike Evans", position: "WR", team: "TB", value: 81 },
  { name: "Keenan Allen", position: "WR", team: "LAC", value: 79 },
  { name: "DeAndre Hopkins", position: "WR", team: "TEN", value: 77 },
  { name: "DK Metcalf", position: "WR", team: "SEA", value: 80 },
  { name: "Terry McLaurin", position: "WR", team: "WAS", value: 75 },
  { name: "Amari Cooper", position: "WR", team: "CLE", value: 76 }
]

// Auto-seed function
async function ensureSeed() {
  try {
    const count = await prisma.player.count()
    
    if (count === 0) {
      console.log('Database empty, seeding players...')
      
      await prisma.player.createMany({
        data: SEED_PLAYERS,
        skipDuplicates: true
      })
      
      console.log(`Seeded ${SEED_PLAYERS.length} players`)
    }
  } catch (error) {
    console.error('Error during auto-seed:', error)
    // Don't throw - let the API continue
  }
}

// Generate synthetic draft picks
function generateDraftPicks() {
  const picks = []
  const currentYear = new Date().getFullYear()
  
  for (let year = currentYear; year <= currentYear + 2; year++) {
    for (let round = 1; round <= 4; round++) {
      picks.push({
        id: `pick-${year}-${round}`,
        name: `${year} Round ${round} Pick`,
        position: "PICK",
        team: "DRAFT",
        value: Math.max(100 - (round * 20) - ((year - currentYear) * 10), 10),
        age: 0,
        type: "pick"
      })
    }
  }
  
  return picks
}

export async function GET(request: NextRequest) {
  try {
    // Auto-seed if database is empty
    await ensureSeed()
    
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    // Get all players first to debug
    const allPlayers = await prisma.player.findMany({
      orderBy: [
        { value: 'desc' },
        { name: 'asc' }
      ]
    })
    
    // Filter players client-side for now to ensure it works
    let players = allPlayers
    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      players = allPlayers.filter(player => 
        player.name.toLowerCase().includes(lowerQuery) ||
        player.team.toLowerCase().includes(lowerQuery) ||
        player.position.toLowerCase().includes(lowerQuery)
      )
    }
    
    // Limit results
    players = players.slice(0, 50)
    
    // Add synthetic draft picks
    const draftPicks = generateDraftPicks()
    
    // Filter draft picks if there's a query
    const filteredPicks = query.trim() 
      ? draftPicks.filter(pick => 
          pick.name.toLowerCase().includes(query.toLowerCase()) ||
          pick.position.toLowerCase().includes(query.toLowerCase())
        )
      : draftPicks.slice(0, 10) // Show top 10 picks when no query
    
    // Combine and format results
    const allAssets = [
      ...players.map(p => ({
        id: p.id.toString(),
        label: p.name,
        position: p.position,
        team: p.team,
        value: p.value,
        age: 25, // Default age since it's not in the schema
        baseValue: p.value,
        type: "player"
      })),
      ...filteredPicks.map(p => ({
        id: p.id,
        label: p.name,
        position: p.position,
        team: p.team,
        value: p.value,
        age: p.age,
        baseValue: p.value,
        type: "pick"
      }))
    ]
    
    // Sort combined results
    allAssets.sort((a, b) => {
      if (b.baseValue !== a.baseValue) {
        return b.baseValue - a.baseValue
      }
      return a.label.localeCompare(b.label)
    })
    
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`Players API: query="${query}", found ${players.length} players, ${filteredPicks.length} picks`)
    }
    
    return NextResponse.json(allAssets)
    
  } catch (error) {
    console.error('Error in players API:', error)
    
    // Return empty array instead of error to prevent UI crashes
    return NextResponse.json([])
  }
}