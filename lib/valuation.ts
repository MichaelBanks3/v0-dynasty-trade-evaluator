import { Position, PlayerStatus } from './generated/prisma'
import { LeagueSettings, calculateSettingsAdjustments, calculateVORMultipliers } from './settings'

// Valuation configuration - single source of truth
export const VALUATION_CONFIG = {
  // Composite scoring weights
  weights: {
    now: {
      market: 0.6,    // 60% market value
      projection: 0.4  // 40% current season projection
    },
    future: {
      market: 0.4,    // 40% market trend
      projection: 0.6  // 60% future projection
    },
    composite: {
      now: 0.4,       // 40% now score
      future: 0.6     // 60% future score
    }
  },
  
  // Age curve multipliers by position
  ageCurves: {
    QB: {
      // QBs have the longest shelf life
      multipliers: {
        20: 0.7, 21: 0.8, 22: 0.9, 23: 0.95, 24: 1.0, 25: 1.0, 26: 1.0, 27: 1.0,
        28: 0.95, 29: 0.9, 30: 0.85, 31: 0.8, 32: 0.75, 33: 0.7, 34: 0.6, 35: 0.5
      }
    },
    RB: {
      // RBs decline steeply after 26
      multipliers: {
        20: 0.6, 21: 0.7, 22: 0.8, 23: 0.9, 24: 0.95, 25: 1.0, 26: 0.9, 27: 0.7,
        28: 0.5, 29: 0.3, 30: 0.2, 31: 0.15, 32: 0.1, 33: 0.05, 34: 0.02, 35: 0.01
      }
    },
    WR: {
      // WRs have flatter decline in mid-20s
      multipliers: {
        20: 0.7, 21: 0.8, 22: 0.9, 23: 0.95, 24: 1.0, 25: 1.0, 26: 1.0, 27: 0.95,
        28: 0.9, 29: 0.8, 30: 0.7, 31: 0.6, 32: 0.5, 33: 0.4, 34: 0.3, 35: 0.2
      }
    },
    TE: {
      // TEs peak later and decline more gradually
      multipliers: {
        20: 0.6, 21: 0.7, 22: 0.8, 23: 0.85, 24: 0.9, 25: 0.95, 26: 1.0, 27: 1.0,
        28: 0.95, 29: 0.9, 30: 0.8, 31: 0.7, 32: 0.6, 33: 0.5, 34: 0.4, 35: 0.3
      }
    }
  },
  
  // Risk adjustments based on player status
  riskAdjustments: {
    [PlayerStatus.ACTIVE]: 1.0,
    [PlayerStatus.QUESTIONABLE]: 0.95,
    [PlayerStatus.DOUBTFUL]: 0.9,
    [PlayerStatus.OUT]: 0.85,
    [PlayerStatus.IR]: 0.8,
    [PlayerStatus.SUSPENDED]: 0.7,
    [PlayerStatus.RETIRED]: 0.0
  },
  
  // Pick valuation curves
  picks: {
    // Year discount (10% per future year)
    yearDiscount: 0.9,
    // Round value multipliers
    roundMultipliers: {
      1: 1.0,   // 1st round
      2: 0.4,   // 2nd round  
      3: 0.15,  // 3rd round
      4: 0.05   // 4th round
    },
    // Base value for current year 1st round pick
    baseValue: 1000
  }
}

// Get age curve multiplier for a player
export function getAgeCurveMultiplier(position: Position, age?: number): number {
  if (!age) return 1.0
  
  const curve = VALUATION_CONFIG.ageCurves[position]
  const multiplier = curve.multipliers[age as keyof typeof curve.multipliers]
  
  // If exact age not found, interpolate between closest ages
  if (multiplier === undefined) {
    const ages = Object.keys(curve.multipliers).map(Number).sort((a, b) => a - b)
    
    if (age < ages[0]) return curve.multipliers[ages[0] as keyof typeof curve.multipliers]
    if (age > ages[ages.length - 1]) return curve.multipliers[ages[ages.length - 1] as keyof typeof curve.multipliers]
    
    // Find the two closest ages and interpolate
    for (let i = 0; i < ages.length - 1; i++) {
      if (age >= ages[i] && age <= ages[i + 1]) {
        const lowerAge = ages[i]
        const upperAge = ages[i + 1]
        const lowerMult = curve.multipliers[lowerAge as keyof typeof curve.multipliers]
        const upperMult = curve.multipliers[upperAge as keyof typeof curve.multipliers]
        
        // Linear interpolation
        const ratio = (age - lowerAge) / (upperAge - lowerAge)
        return lowerMult + (upperMult - lowerMult) * ratio
      }
    }
  }
  
  return multiplier || 1.0
}

// Get risk adjustment for a player
export function getRiskAdjustment(status: PlayerStatus): number {
  return VALUATION_CONFIG.riskAdjustments[status] || 1.0
}

// Calculate composite valuation for a player with settings adjustments
export function calculatePlayerValuation(
  marketValue: number,
  projNow: number,
  projFuture: number,
  position: Position,
  age?: number,
  status: PlayerStatus = PlayerStatus.ACTIVE,
  settings?: LeagueSettings
): {
  nowScore: number
  futureScore: number
  compositeValue: number
  ageAdjustment: number
  riskAdjustment: number
  settingsAdjustments?: {
    qbMultiplier: number
    teMultiplier: number
    scoringFactor: number
    vorMultiplier: number
    combinedMultiplier: number
  }
} {
  // Calculate base now score (weighted combination of market and current projection)
  let nowScore = Math.round(
    marketValue * VALUATION_CONFIG.weights.now.market +
    projNow * VALUATION_CONFIG.weights.now.projection
  )
  
  // Calculate base future score (weighted combination of market trend and future projection)
  let futureScoreBase = Math.round(
    marketValue * VALUATION_CONFIG.weights.future.market +
    projFuture * VALUATION_CONFIG.weights.future.projection
  )
  
  // Apply age curve adjustment
  const ageAdjustment = getAgeCurveMultiplier(position, age)
  
  // Apply risk adjustment
  const riskAdjustment = getRiskAdjustment(status)
  
  // Calculate base future score
  let futureScore = Math.round(futureScoreBase * ageAdjustment * riskAdjustment)
  
  // Apply settings adjustments if provided
  let settingsAdjustments
  if (settings) {
    const vorMultipliers = calculateVORMultipliers(settings)
    settingsAdjustments = calculateSettingsAdjustments(position, settings, vorMultipliers)
    
    // Apply scoring factor to projection components
    const nowProjectionComponent = projNow * VALUATION_CONFIG.weights.now.projection
    const futureProjectionComponent = projFuture * VALUATION_CONFIG.weights.future.projection * ageAdjustment * riskAdjustment
    
    // Recalculate scores with scoring factor applied to projections
    nowScore = Math.round(
      marketValue * VALUATION_CONFIG.weights.now.market +
      nowProjectionComponent * settingsAdjustments.scoringFactor
    )
    
    futureScore = Math.round(
      marketValue * VALUATION_CONFIG.weights.future.market * ageAdjustment * riskAdjustment +
      futureProjectionComponent * settingsAdjustments.scoringFactor
    )
    
    // Apply combined settings multiplier (QB, TE, VOR)
    nowScore = Math.round(nowScore * settingsAdjustments.combinedMultiplier)
    futureScore = Math.round(futureScore * settingsAdjustments.combinedMultiplier)
  }
  
  // Calculate composite value
  const compositeValue = Math.round(
    nowScore * VALUATION_CONFIG.weights.composite.now +
    futureScore * VALUATION_CONFIG.weights.composite.future
  )
  
  return {
    nowScore,
    futureScore,
    compositeValue,
    ageAdjustment,
    riskAdjustment,
    settingsAdjustments
  }
}

// Calculate pick valuation
export function calculatePickValuation(
  year: number,
  round: number,
  baselineValue?: number
): number {
  const currentYear = new Date().getFullYear()
  const yearsFromNow = year - currentYear
  
  // Apply year discount
  const yearDiscount = Math.pow(VALUATION_CONFIG.picks.yearDiscount, yearsFromNow)
  
  // Get round multiplier
  const roundMultiplier = VALUATION_CONFIG.picks.roundMultipliers[round as keyof typeof VALUATION_CONFIG.picks.roundMultipliers] || 0.01
  
  // Calculate final value
  const baseValue = baselineValue || VALUATION_CONFIG.picks.baseValue
  return Math.round(baseValue * roundMultiplier * yearDiscount)
}

// Generate explanation text for a trade evaluation
export function generateTradeExplanation(
  teamANow: number,
  teamAFuture: number,
  teamBNow: number,
  teamBFuture: number,
  verdict: string
): string {
  const totalA = teamANow + teamAFuture
  const totalB = teamBNow + teamBFuture
  const diff = Math.abs(totalA - totalB)
  const percentDiff = Math.round((diff / Math.max(totalA, totalB)) * 100)
  
  const nowDiff = teamANow - teamBNow
  const futureDiff = teamAFuture - teamBFuture
  
  let explanation = ""
  
  if (verdict === "FAIR") {
    explanation = `This trade is well-balanced with only a ${percentDiff}% difference in total value. `
  } else {
    explanation = `This trade ${verdict === "FAVORS_A" ? "favors Team A" : "favors Team B"} by ${percentDiff}%. `
  }
  
  if (Math.abs(nowDiff) > Math.abs(futureDiff) * 2) {
    explanation += "The trade heavily favors one team's win-now potential."
  } else if (Math.abs(futureDiff) > Math.abs(nowDiff) * 2) {
    explanation += "The trade heavily favors one team's future outlook."
  } else {
    explanation += "The trade balances both win-now and future considerations."
  }
  
  return explanation
}

// Generate balancing suggestion
export function generateBalancingSuggestion(
  teamANow: number,
  teamAFuture: number,
  teamBNow: number,
  teamBFuture: number,
  verdict: string
): string | null {
  const totalA = teamANow + teamAFuture
  const totalB = teamBNow + teamBFuture
  const diff = Math.abs(totalA - totalB)
  const percentDiff = (diff / Math.max(totalA, totalB)) * 100
  
  // Only suggest if within 10% and not already fair
  if (percentDiff > 10 || verdict === "FAIR") {
    return null
  }
  
  const isTeamAFavored = verdict === "FAVORS_A"
  const favoredTeam = isTeamAFavored ? "Team A" : "Team B"
  const disfavoredTeam = isTeamAFavored ? "Team B" : "Team A"
  
  // Simple suggestion based on the difference
  if (diff < 200) {
    return `Add a late-round pick to ${disfavoredTeam} to balance this trade.`
  } else if (diff < 500) {
    return `Add a mid-round pick to ${disfavoredTeam} to balance this trade.`
  } else {
    return `Add a high-round pick or quality player to ${disfavoredTeam} to balance this trade.`
  }
}
