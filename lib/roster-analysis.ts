import { LeagueSettings } from './settings'
import { prisma } from './db'

export interface Player {
  id: string
  name: string
  position: string
  team: string
  age: number
  status: string
  compositeValue: number
  nowScore: number
  futureScore: number
}

export interface Pick {
  id: string
  year: number
  round: number
  compositeValue: number
}

export interface TeamProfile {
  timeline: 'contend' | 'retool' | 'rebuild'
  riskTolerance: 'low' | 'medium' | 'high'
  leagueSettings: LeagueSettings
  roster: string[]
  ownedPicks: string[]
}

export interface StartingLineup {
  QB: Player[]
  RB: Player[]
  WR: Player[]
  TE: Player[]
  FLEX: Player[]
  SUPERFLEX: Player[]
  totalNow: number
  totalFuture: number
  totalComposite: number
}

export interface DepthCoverage {
  QB: { viable: number; coverage: number }
  RB: { viable: number; coverage: number }
  WR: { viable: number; coverage: number }
  TE: { viable: number; coverage: number }
}

export interface RosterFlags {
  qbGap: boolean
  thinDepth: { position: string; coverage: number }[]
  criticalGaps: string[]
  riskFlags: string[]
  ageSkew: string[]
}

export interface TeamIndices {
  nowIndex: number
  futureIndex: number
}

export interface RosterAnalysis {
  startingLineup: StartingLineup
  depthCoverage: DepthCoverage
  flags: RosterFlags
  indices: TeamIndices
}

// Get player data from database
export async function getPlayerData(playerIds: string[]): Promise<Player[]> {
  if (playerIds.length === 0) return []
  
  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    include: {
      valuations: {
        where: { 
          scoring: 'PPR',
          superflex: false,
          tePremium: 1.0
        }, // Use default settings for now
        take: 1
      }
    }
  })

  return players.map(player => ({
    id: player.id,
    name: player.name,
    position: player.position,
    team: player.team,
    age: player.age,
    status: player.status,
    compositeValue: player.valuations[0]?.compositeValue || 0,
    nowScore: player.valuations[0]?.nowScore || 0,
    futureScore: player.valuations[0]?.futureScore || 0
  }))
}

// Get pick data from database
export async function getPickData(pickIds: string[]): Promise<Pick[]> {
  if (pickIds.length === 0) return []
  
  const picks = await prisma.pick.findMany({
    where: { id: { in: pickIds } }
  })

  return picks.map(pick => ({
    id: pick.id,
    year: pick.year,
    round: pick.round,
    compositeValue: pick.baselineValue
  }))
}

// Calculate replacement baseline for a position
export function getReplacementBaseline(position: string, leagueSettings: LeagueSettings): number {
  // Simplified replacement logic - in practice this would be more sophisticated
  const baselines = {
    QB: 1000,
    RB: 800,
    WR: 700,
    TE: 600
  }
  
  // Adjust for league size and starting requirements
  const multiplier = leagueSettings.leagueSize / 12
  return baselines[position as keyof typeof baselines] * multiplier
}

// Build optimal starting lineup
export function buildStartingLineup(
  players: Player[],
  leagueSettings: LeagueSettings
): StartingLineup {
  const { starters } = leagueSettings
  
  // Sort players by composite value (descending)
  const sortedPlayers = [...players].sort((a, b) => b.compositeValue - a.compositeValue)
  
  const lineup: StartingLineup = {
    QB: [],
    RB: [],
    WR: [],
    TE: [],
    FLEX: [],
    SUPERFLEX: [],
    totalNow: 0,
    totalFuture: 0,
    totalComposite: 0
  }
  
  // Fill required positions first
  const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0, FLEX: 0, SUPERFLEX: 0 }
  const usedPlayers = new Set<string>()
  
  // Fill QB slots
  for (let i = 0; i < starters.QB; i++) {
    const qb = sortedPlayers.find(p => p.position === 'QB' && !usedPlayers.has(p.id))
    if (qb) {
      lineup.QB.push(qb)
      usedPlayers.add(qb.id)
      positionCounts.QB++
    }
  }
  
  // Fill RB slots
  for (let i = 0; i < starters.RB; i++) {
    const rb = sortedPlayers.find(p => p.position === 'RB' && !usedPlayers.has(p.id))
    if (rb) {
      lineup.RB.push(rb)
      usedPlayers.add(rb.id)
      positionCounts.RB++
    }
  }
  
  // Fill WR slots
  for (let i = 0; i < starters.WR; i++) {
    const wr = sortedPlayers.find(p => p.position === 'WR' && !usedPlayers.has(p.id))
    if (wr) {
      lineup.WR.push(wr)
      usedPlayers.add(wr.id)
      positionCounts.WR++
    }
  }
  
  // Fill TE slots
  for (let i = 0; i < starters.TE; i++) {
    const te = sortedPlayers.find(p => p.position === 'TE' && !usedPlayers.has(p.id))
    if (te) {
      lineup.TE.push(te)
      usedPlayers.add(te.id)
      positionCounts.TE++
    }
  }
  
  // Fill FLEX slots (RB/WR/TE)
  for (let i = 0; i < starters.FLEX; i++) {
    const flex = sortedPlayers.find(p => 
      ['RB', 'WR', 'TE'].includes(p.position) && !usedPlayers.has(p.id)
    )
    if (flex) {
      lineup.FLEX.push(flex)
      usedPlayers.add(flex.id)
      positionCounts.FLEX++
    }
  }
  
  // Fill SUPERFLEX slots (QB preferred, then RB/WR/TE)
  for (let i = 0; i < starters.SUPERFLEX; i++) {
    const sf = sortedPlayers.find(p => 
      p.position === 'QB' && !usedPlayers.has(p.id)
    ) || sortedPlayers.find(p => 
      ['RB', 'WR', 'TE'].includes(p.position) && !usedPlayers.has(p.id)
    )
    if (sf) {
      lineup.SUPERFLEX.push(sf)
      usedPlayers.add(sf.id)
      positionCounts.SUPERFLEX++
    }
  }
  
  // Calculate totals
  const allStarters = [
    ...lineup.QB,
    ...lineup.RB,
    ...lineup.WR,
    ...lineup.TE,
    ...lineup.FLEX,
    ...lineup.SUPERFLEX
  ]
  
  lineup.totalNow = allStarters.reduce((sum, p) => sum + p.nowScore, 0)
  lineup.totalFuture = allStarters.reduce((sum, p) => sum + p.futureScore, 0)
  lineup.totalComposite = allStarters.reduce((sum, p) => sum + p.compositeValue, 0)
  
  return lineup
}

// Calculate depth coverage
export function calculateDepthCoverage(
  players: Player[],
  lineup: StartingLineup,
  leagueSettings: LeagueSettings
): DepthCoverage {
  const { starters } = leagueSettings
  const usedPlayers = new Set([
    ...lineup.QB.map(p => p.id),
    ...lineup.RB.map(p => p.id),
    ...lineup.WR.map(p => p.id),
    ...lineup.TE.map(p => p.id),
    ...lineup.FLEX.map(p => p.id),
    ...lineup.SUPERFLEX.map(p => p.id)
  ])
  
  const benchPlayers = players.filter(p => !usedPlayers.has(p.id))
  
  const coverage: DepthCoverage = {
    QB: { viable: 0, coverage: 0 },
    RB: { viable: 0, coverage: 0 },
    WR: { viable: 0, coverage: 0 },
    TE: { viable: 0, coverage: 0 }
  }
  
  // Count viable bench players by position
  for (const position of ['QB', 'RB', 'WR', 'TE'] as const) {
    const baseline = getReplacementBaseline(position, leagueSettings)
    const viableBench = benchPlayers.filter(p => 
      p.position === position && p.compositeValue >= baseline
    )
    
    coverage[position] = {
      viable: viableBench.length,
      coverage: starters[position] > 0 ? viableBench.length / starters[position] : 0
    }
  }
  
  return coverage
}

// Identify roster flags and issues
export function identifyRosterFlags(
  players: Player[],
  lineup: StartingLineup,
  coverage: DepthCoverage,
  leagueSettings: LeagueSettings,
  profile: TeamProfile
): RosterFlags {
  const flags: RosterFlags = {
    qbGap: false,
    thinDepth: [],
    criticalGaps: [],
    riskFlags: [],
    ageSkew: []
  }
  
  const { starters } = leagueSettings
  
  // Check QB gap in Superflex
  if (starters.SUPERFLEX > 0) {
    const totalQBs = lineup.QB.length + lineup.SUPERFLEX.filter(p => p.position === 'QB').length
    if (totalQBs < starters.QB + starters.SUPERFLEX) {
      flags.qbGap = true
    }
  }
  
  // Check depth coverage
  for (const [position, data] of Object.entries(coverage)) {
    if (data.coverage < 0.5) {
      flags.thinDepth.push({ position, coverage: data.coverage })
    }
    if (data.coverage === 0 && starters[position as keyof typeof starters] > 0) {
      flags.criticalGaps.push(position)
    }
  }
  
  // Check risk flags (injured/out players in starting lineup)
  const allStarters = [
    ...lineup.QB,
    ...lineup.RB,
    ...lineup.WR,
    ...lineup.TE,
    ...lineup.FLEX,
    ...lineup.SUPERFLEX
  ]
  
  const riskStarters = allStarters.filter(p => 
    p.status === 'IR' || p.status === 'Out' || p.status === 'Doubtful'
  )
  
  if (riskStarters.length > 0) {
    flags.riskFlags.push(`${riskStarters.length} injured/out players in starting lineup`)
  }
  
  // Check age skew vs timeline
  if (profile.timeline === 'rebuild') {
    const oldRBs = allStarters.filter(p => p.position === 'RB' && p.age > 26)
    if (oldRBs.length > 1) {
      flags.ageSkew.push(`Multiple aging RBs (${oldRBs.length}) on rebuild timeline`)
    }
  }
  
  return flags
}

// Calculate team indices (0-100 scale)
export function calculateTeamIndices(
  lineup: StartingLineup,
  players: Player[],
  leagueSettings: LeagueSettings
): TeamIndices {
  // Get top bench options for depth weighting
  const usedPlayers = new Set([
    ...lineup.QB.map(p => p.id),
    ...lineup.RB.map(p => p.id),
    ...lineup.WR.map(p => p.id),
    ...lineup.TE.map(p => p.id),
    ...lineup.FLEX.map(p => p.id),
    ...lineup.SUPERFLEX.map(p => p.id)
  ])
  
  const benchPlayers = players.filter(p => !usedPlayers.has(p.id))
  const topBench = benchPlayers
    .sort((a, b) => b.compositeValue - a.compositeValue)
    .slice(0, 6) // Top 6 bench players
  
  // Calculate indices (simplified - in practice would be more sophisticated)
  const maxPossible = 10000 // Arbitrary max for scaling
  const nowIndex = Math.min(100, (lineup.totalNow + topBench.reduce((sum, p) => sum + p.nowScore, 0) * 0.1) / maxPossible * 100)
  const futureIndex = Math.min(100, (lineup.totalFuture + topBench.reduce((sum, p) => sum + p.futureScore, 0) * 0.1) / maxPossible * 100)
  
  return {
    nowIndex: Math.round(nowIndex),
    futureIndex: Math.round(futureIndex)
  }
}

// Main analysis function
export async function analyzeRoster(profile: TeamProfile): Promise<RosterAnalysis> {
  const players = await getPlayerData(profile.roster)
  const picks = await getPickData(profile.ownedPicks)
  
  const lineup = buildStartingLineup(players, profile.leagueSettings)
  const coverage = calculateDepthCoverage(players, lineup, profile.leagueSettings)
  const flags = identifyRosterFlags(players, lineup, coverage, profile.leagueSettings, profile)
  const indices = calculateTeamIndices(lineup, players, profile.leagueSettings)
  
  return {
    startingLineup: lineup,
    depthCoverage: coverage,
    flags,
    indices
  }
}

// Analyze trade impact
export async function analyzeTradeImpact(
  profile: TeamProfile,
  teamAAssets: string[],
  teamBAssets: string[]
): Promise<{
  preTrade: RosterAnalysis
  postTrade: RosterAnalysis
  deltas: {
    nowIndex: number
    futureIndex: number
    coverage: { [position: string]: number }
  }
}> {
  const preTrade = await analyzeRoster(profile)
  
  // Apply trade (simplified - assumes team gets teamA assets, gives teamB assets)
  const newRoster = [
    ...profile.roster.filter(id => !teamBAssets.includes(id)),
    ...teamAAssets.filter(id => id.startsWith('player:'))
  ]
  
  const newPicks = [
    ...profile.ownedPicks.filter(id => !teamBAssets.includes(id)),
    ...teamAAssets.filter(id => id.startsWith('pick:'))
  ]
  
  const postTradeProfile = {
    ...profile,
    roster: newRoster,
    ownedPicks: newPicks
  }
  
  const postTrade = await analyzeRoster(postTradeProfile)
  
  const deltas = {
    nowIndex: postTrade.indices.nowIndex - preTrade.indices.nowIndex,
    futureIndex: postTrade.indices.futureIndex - preTrade.indices.futureIndex,
    coverage: {
      QB: postTrade.depthCoverage.QB.coverage - preTrade.depthCoverage.QB.coverage,
      RB: postTrade.depthCoverage.RB.coverage - preTrade.depthCoverage.RB.coverage,
      WR: postTrade.depthCoverage.WR.coverage - preTrade.depthCoverage.WR.coverage,
      TE: postTrade.depthCoverage.TE.coverage - preTrade.depthCoverage.TE.coverage
    }
  }
  
  return { preTrade, postTrade, deltas }
}
