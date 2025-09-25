// Simple power index calculation for league teams
export interface LeagueTeam {
  id: string
  roster: {
    starters: string[]
    bench: string[]
  }
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
}

export interface PowerIndexResult {
  score: number
  rank: number
  breakdown: {
    recordScore: number
    pointsScore: number
    rosterScore: number
  }
}

export function computePowerIndex(
  team: LeagueTeam,
  allTeams: LeagueTeam[],
  playerValues: Record<string, number> = {}
): PowerIndexResult {
  // Record component (40% weight)
  const winPct = team.wins / (team.wins + team.losses) || 0
  const recordScore = winPct * 100

  // Points component (30% weight)
  const avgPointsFor = allTeams.reduce((sum, t) => sum + t.pointsFor, 0) / allTeams.length
  const pointsScore = Math.min((team.pointsFor / avgPointsFor) * 100, 150) // Cap at 150

  // Roster component (30% weight)
  const starterValues = team.roster.starters
    .map(playerId => playerValues[playerId] || 0)
    .reduce((sum, val) => sum + val, 0)
  
  const benchValues = team.roster.bench
    .map(playerId => playerValues[playerId] || 0)
    .reduce((sum, val) => sum + val, 0)
  
  const rosterScore = Math.min((starterValues + benchValues * 0.3) / 10, 100) // Normalize and cap

  // Weighted composite score
  const score = (recordScore * 0.4) + (pointsScore * 0.3) + (rosterScore * 0.3)

  // Calculate rank
  const allScores = allTeams.map(t => computePowerIndex(t, allTeams, playerValues).score)
  const rank = allScores.filter(s => s > score).length + 1

  return {
    score: Math.round(score),
    rank,
    breakdown: {
      recordScore: Math.round(recordScore),
      pointsScore: Math.round(pointsScore),
      rosterScore: Math.round(rosterScore),
    }
  }
}