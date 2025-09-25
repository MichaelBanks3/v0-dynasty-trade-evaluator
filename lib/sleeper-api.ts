// Sleeper API integration for league imports
export interface SleeperLeague {
  league_id: string
  name: string
  season: string
  season_type: string
  status: string
  total_rosters: number
  roster_positions: string[]
  scoring_settings: Record<string, number>
  settings: Record<string, any>
  metadata?: Record<string, any>
}

export interface SleeperRoster {
  roster_id: string
  owner_id: string
  players: string[]
  taxi?: string[]
  starters?: string[]
  reserve?: string[]
  metadata?: Record<string, any>
}

export interface SleeperUser {
  user_id: string
  username: string
  display_name: string
  avatar?: string
  metadata?: Record<string, any>
}

export interface SleeperTradedPick {
  season: string
  round: number
  roster_id: number
  previous_owner_id: number
  owner_id: number
}

// Sleeper API base URL
const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1'

// Rate limiting: Sleeper allows 1000 requests per hour
const RATE_LIMIT_DELAY = 100 // 100ms between requests

let lastRequestTime = 0

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest))
  }
  
  lastRequestTime = Date.now()
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Sleeper API error: ${response.status} ${response.statusText}`)
  }
  
  return response
}

export async function fetchSleeperLeague(leagueId: string): Promise<SleeperLeague> {
  const url = `${SLEEPER_BASE_URL}/league/${leagueId}`
  const response = await rateLimitedFetch(url)
  return response.json()
}

export async function fetchSleeperRosters(leagueId: string): Promise<SleeperRoster[]> {
  const url = `${SLEEPER_BASE_URL}/league/${leagueId}/rosters`
  const response = await rateLimitedFetch(url)
  return response.json()
}

export async function fetchSleeperUsers(leagueId: string): Promise<SleeperUser[]> {
  const url = `${SLEEPER_BASE_URL}/league/${leagueId}/users`
  const response = await rateLimitedFetch(url)
  return response.json()
}

export async function fetchSleeperTradedPicks(leagueId: string): Promise<SleeperTradedPick[]> {
  try {
    const url = `${SLEEPER_BASE_URL}/league/${leagueId}/traded_picks`
    const response = await rateLimitedFetch(url)
    return response.json()
  } catch (error) {
    // Traded picks endpoint may not be available for all leagues
    console.warn('Traded picks not available for league:', leagueId)
    return []
  }
}

// Helper function to detect league settings from Sleeper data
export function detectLeagueSettings(league: SleeperLeague): any {
  const settings: any = {
    leagueSize: league.total_rosters,
    scoring: 'PPR', // Default assumption
    superflex: false,
    tePremium: false,
    tePremiumMultiplier: 1.5,
    starters: {
      QB: 0,
      RB: 0,
      WR: 0,
      TE: 0,
      FLEX: 0,
      SUPERFLEX: 0
    }
  }

  // Count starting positions
  const positionCounts: Record<string, number> = {}
  league.roster_positions.forEach(pos => {
    positionCounts[pos] = (positionCounts[pos] || 0) + 1
  })

  // Map Sleeper positions to our format
  settings.starters.QB = positionCounts['QB'] || 0
  settings.starters.RB = positionCounts['RB'] || 0
  settings.starters.WR = positionCounts['WR'] || 0
  settings.starters.TE = positionCounts['TE'] || 0
  settings.starters.FLEX = positionCounts['FLEX'] || 0
  settings.starters.SUPERFLEX = positionCounts['SUPERFLEX'] || 0

  // Detect Superflex
  if (settings.starters.SUPERFLEX > 0) {
    settings.superflex = true
  }

  // Detect scoring system
  if (league.scoring_settings) {
    const rec = league.scoring_settings.rec || 0
    const rec_half = league.scoring_settings.rec_half || 0
    
    if (rec === 1) {
      settings.scoring = 'PPR'
    } else if (rec_half === 1) {
      settings.scoring = 'Half'
    } else {
      settings.scoring = 'Standard'
    }

    // Detect TE Premium
    const te_rec = league.scoring_settings.te_rec || 0
    if (te_rec > rec) {
      settings.tePremium = true
      settings.tePremiumMultiplier = te_rec / Math.max(rec, 1)
    }
  }

  return settings
}

// Helper function to map Sleeper player IDs to our player IDs
export async function mapSleeperPlayers(sleeperPlayerIds: string[]): Promise<{
  mapped: string[]
  unmatched: string[]
}> {
  const { prisma } = await import('./db')
  
  const players = await prisma.player.findMany({
    where: {
      sleeperId: { in: sleeperPlayerIds }
    },
    select: {
      id: true,
      sleeperId: true
    }
  })

  const mappedIds = players.map(p => p.id)
  const matchedSleeperIds = players.map(p => p.sleeperId)
  const unmatchedIds = sleeperPlayerIds.filter(id => !matchedSleeperIds.includes(id))

  return {
    mapped: mappedIds,
    unmatched: unmatchedIds
  }
}
