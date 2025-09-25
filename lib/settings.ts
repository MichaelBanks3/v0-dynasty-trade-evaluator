import { Position } from './generated/prisma'

// League settings interface - single source of truth
export interface LeagueSettings {
  scoring: 'PPR' | 'Half' | 'Standard'
  superflex: boolean
  tePremium: boolean
  tePremiumMultiplier: number
  leagueSize: number
  starters: {
    QB: number
    RB: number
    WR: number
    TE: number
    FLEX: number
    SUPERFLEX: number
  }
}

// Default settings
export const DEFAULT_SETTINGS: LeagueSettings = {
  scoring: 'PPR',
  superflex: false,
  tePremium: false,
  tePremiumMultiplier: 1.5,
  leagueSize: 12,
  starters: {
    QB: 1,
    RB: 2,
    WR: 2,
    TE: 1,
    FLEX: 1,
    SUPERFLEX: 0
  }
}

// Settings multipliers and adjustments
export const SETTINGS_MULTIPLIERS = {
  // Superflex QB multiplier
  superflex: {
    qbMultiplier: 1.3
  },
  
  // TE Premium multiplier
  tePremium: {
    defaultMultiplier: 1.5
  },
  
  // Scoring preset factors (affects projection components)
  scoring: {
    PPR: 1.0,
    Half: 0.85,
    Standard: 0.70
  },
  
  // VOR (Value Over Replacement) scarcity ranges
  vor: {
    minMultiplier: 0.9,
    maxMultiplier: 1.15,
    // Base replacement ranks by position (for 12-team league)
    baseReplacementRanks: {
      QB: 12,   // 1 QB per team
      RB: 24,   // 2 RB per team
      WR: 24,   // 2 WR per team
      TE: 12,   // 1 TE per team
      FLEX: 12  // 1 FLEX per team
    }
  }
}

// Generate a stable hash for settings (for caching)
export function getSettingsHash(settings: LeagueSettings): string {
  // Create a normalized object to ensure consistent hashing
  const normalized = {
    scoring: settings.scoring,
    superflex: settings.superflex,
    tePremium: settings.tePremium,
    tePremiumMultiplier: Math.round(settings.tePremiumMultiplier * 100) / 100, // Round to 2 decimals
    leagueSize: settings.leagueSize,
    starters: {
      QB: settings.starters.QB,
      RB: settings.starters.RB,
      WR: settings.starters.WR,
      TE: settings.starters.TE,
      FLEX: settings.starters.FLEX,
      SUPERFLEX: settings.starters.SUPERFLEX
    }
  }
  
  // Simple hash function (for production, consider using crypto.createHash)
  return btoa(JSON.stringify(normalized)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
}

// Calculate VOR (Value Over Replacement) multipliers for each position
export function calculateVORMultipliers(settings: LeagueSettings): Record<Position, number> {
  const { leagueSize, starters } = settings
  const { minMultiplier, maxMultiplier, baseReplacementRanks } = SETTINGS_MULTIPLIERS.vor
  
  // Calculate actual replacement ranks based on league size and starters
  const replacementRanks = {
    QB: leagueSize * (starters.QB + starters.SUPERFLEX * 0.5), // SUPERFLEX counts as 0.5 QB
    RB: leagueSize * (starters.RB + starters.FLEX * 0.4), // FLEX is ~40% RB
    WR: leagueSize * (starters.WR + starters.FLEX * 0.4), // FLEX is ~40% WR
    TE: leagueSize * (starters.TE + starters.FLEX * 0.2)  // FLEX is ~20% TE
  }
  
  // Calculate scarcity multipliers
  const multipliers: Record<Position, number> = {
    QB: 1.0,
    RB: 1.0,
    WR: 1.0,
    TE: 1.0
  }
  
  // Apply scarcity logic: higher replacement rank = lower scarcity = lower multiplier
  for (const [position, replacementRank] of Object.entries(replacementRanks)) {
    const baseRank = baseReplacementRanks[position as keyof typeof baseReplacementRanks]
    const ratio = baseRank / replacementRank
    
    // Map ratio to multiplier range (higher ratio = higher scarcity = higher multiplier)
    const normalizedRatio = Math.max(0.5, Math.min(2.0, ratio)) // Cap between 0.5 and 2.0
    const multiplier = minMultiplier + (normalizedRatio - 0.5) * (maxMultiplier - minMultiplier) / 1.5
    
    multipliers[position as Position] = Math.round(multiplier * 100) / 100 // Round to 2 decimals
  }
  
  return multipliers
}

// Calculate settings adjustments for a player
export function calculateSettingsAdjustments(
  position: Position,
  settings: LeagueSettings,
  vorMultipliers: Record<Position, number>
): {
  qbMultiplier: number
  teMultiplier: number
  scoringFactor: number
  vorMultiplier: number
  combinedMultiplier: number
} {
  const { scoring, superflex, tePremium, tePremiumMultiplier } = settings
  
  // QB multiplier (Superflex)
  const qbMultiplier = position === 'QB' && superflex ? SETTINGS_MULTIPLIERS.superflex.qbMultiplier : 1.0
  
  // TE multiplier (TE Premium)
  const teMultiplier = position === 'TE' && tePremium ? tePremiumMultiplier : 1.0
  
  // Scoring factor (affects projection components)
  const scoringFactor = SETTINGS_MULTIPLIERS.scoring[scoring]
  
  // VOR multiplier (positional scarcity)
  const vorMultiplier = vorMultipliers[position]
  
  // Combined multiplier (applied to both now and future scores)
  const combinedMultiplier = qbMultiplier * teMultiplier * vorMultiplier
  
  return {
    qbMultiplier,
    teMultiplier,
    scoringFactor,
    vorMultiplier,
    combinedMultiplier: Math.round(combinedMultiplier * 1000) / 1000 // Round to 3 decimals
  }
}

// Format settings for display
export function formatSettingsForDisplay(settings: LeagueSettings): string {
  const parts = []
  
  // Scoring
  parts.push(settings.scoring)
  
  // Superflex
  if (settings.superflex) {
    parts.push('SF')
  }
  
  // TE Premium
  if (settings.tePremium) {
    parts.push(`TEP ${settings.tePremiumMultiplier}`)
  }
  
  // League size
  parts.push(`${settings.leagueSize}-team`)
  
  // Starters
  const starterParts = []
  if (settings.starters.QB > 0) starterParts.push(`${settings.starters.QB}QB`)
  if (settings.starters.RB > 0) starterParts.push(`${settings.starters.RB}RB`)
  if (settings.starters.WR > 0) starterParts.push(`${settings.starters.WR}WR`)
  if (settings.starters.TE > 0) starterParts.push(`${settings.starters.TE}TE`)
  if (settings.starters.FLEX > 0) starterParts.push(`${settings.starters.FLEX}FLEX`)
  if (settings.starters.SUPERFLEX > 0) starterParts.push(`${settings.starters.SUPERFLEX}SF`)
  
  if (starterParts.length > 0) {
    parts.push(starterParts.join('/'))
  }
  
  return parts.join(' • ')
}

// Validate settings
export function validateSettings(settings: Partial<LeagueSettings>): LeagueSettings {
  const validated = { ...DEFAULT_SETTINGS, ...settings }
  
  // Ensure valid values
  if (!['PPR', 'Half', 'Standard'].includes(validated.scoring)) {
    validated.scoring = 'PPR'
  }
  
  if (validated.tePremiumMultiplier < 1.0 || validated.tePremiumMultiplier > 3.0) {
    validated.tePremiumMultiplier = 1.5
  }
  
  if (validated.leagueSize < 4 || validated.leagueSize > 20) {
    validated.leagueSize = 12
  }
  
  // Ensure starter counts are reasonable
  const starters = validated.starters
  starters.QB = Math.max(0, Math.min(3, starters.QB))
  starters.RB = Math.max(0, Math.min(4, starters.RB))
  starters.WR = Math.max(0, Math.min(5, starters.WR))
  starters.TE = Math.max(0, Math.min(3, starters.TE))
  starters.FLEX = Math.max(0, Math.min(3, starters.FLEX))
  starters.SUPERFLEX = Math.max(0, Math.min(2, starters.SUPERFLEX))
  
  return validated
}
