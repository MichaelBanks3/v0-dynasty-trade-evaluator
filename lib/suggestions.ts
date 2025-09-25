import { computePowerIndex, LeagueTeam } from './powerIndex'

export interface SuggestedMove {
  type: 'buy' | 'sell'
  player: {
    id: string
    name: string
    position: string
    team: string
  }
  rationale: string
  confidence: 'high' | 'medium' | 'low'
}

export interface LeagueData {
  teams: LeagueTeam[]
  standings: Array<{
    teamId: string
    wins: number
    losses: number
    pointsFor: number
    pointsAgainst: number
  }>
  playerValues: Record<string, number>
}

export function getSuggestedMoves(
  leagueData: LeagueData,
  yourTeamId: string,
  playerNames: Record<string, string> = {}
): SuggestedMove[] {
  const suggestions: SuggestedMove[] = []
  
  // Find your team
  const yourTeam = leagueData.teams.find(t => t.id === yourTeamId)
  if (!yourTeam) return suggestions

  // Calculate power index for your team
  const yourPowerIndex = computePowerIndex(yourTeam, leagueData.teams, leagueData.playerValues)
  
  // Get your team's standings
  const yourStandings = leagueData.standings.find(s => s.teamId === yourTeamId)
  if (!yourStandings) return suggestions

  // Determine if you're contending or rebuilding
  const isContending = yourStandings.wins > yourStandings.losses && yourPowerIndex.rank <= 4
  const isRebuilding = yourStandings.wins < yourStandings.losses || yourPowerIndex.rank > 8

  // Analyze roster needs
  const positionCounts = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
  }

  // Count positions in starting lineup (simplified)
  yourTeam.roster.starters.forEach(playerId => {
    const playerName = playerNames[playerId] || ''
    if (playerName.includes('QB')) positionCounts.QB++
    else if (playerName.includes('RB')) positionCounts.RB++
    else if (playerName.includes('WR')) positionCounts.WR++
    else if (playerName.includes('TE')) positionCounts.TE++
  })

  // Generate suggestions based on team state
  if (isContending) {
    // Contending teams should buy win-now players
    if (positionCounts.QB < 2) {
      suggestions.push({
        type: 'buy',
        player: { id: 'suggested-qb', name: 'Elite QB', position: 'QB', team: 'Any' },
        rationale: 'Contending teams need strong QB play. Consider acquiring a top-tier QB.',
        confidence: 'high'
      })
    }
    
    if (positionCounts.RB < 2) {
      suggestions.push({
        type: 'buy',
        player: { id: 'suggested-rb', name: 'Veteran RB', position: 'RB', team: 'Any' },
        rationale: 'Add a reliable veteran RB for consistent production.',
        confidence: 'medium'
      })
    }
  }

  if (isRebuilding) {
    // Rebuilding teams should sell veterans for picks/young players
    suggestions.push({
      type: 'sell',
      player: { id: 'suggested-vet', name: 'Veteran Players', position: 'Any', team: 'Your Team' },
      rationale: 'Rebuilding teams should trade veterans for future assets and young talent.',
      confidence: 'high'
    })
  }

  // Always suggest based on roster balance
  if (positionCounts.WR < 3) {
    suggestions.push({
      type: 'buy',
      player: { id: 'suggested-wr', name: 'Young WR', position: 'WR', team: 'Any' },
      rationale: 'WR depth is crucial in dynasty leagues. Consider adding young, talented WRs.',
      confidence: 'medium'
    })
  }

  return suggestions.slice(0, 3) // Limit to 3 suggestions
}