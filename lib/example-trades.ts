import { LeagueSettings } from './settings'

export interface ExampleTrade {
  id: string
  title: string
  description: string
  teamA: string[]
  teamB: string[]
  settings: LeagueSettings
  category: 'superflex' | 'te-premium' | 'rebuild-vs-win-now' | 'balanced'
}

export const exampleTrades: ExampleTrade[] = [
  {
    id: 'superflex-qb-trade',
    title: 'Superflex QB Trade',
    description: 'Elite QB for young WR in Superflex league',
    teamA: ['player:1'], // Patrick Mahomes
    teamB: ['player:2', 'player:3'], // Josh Allen + CeeDee Lamb
    settings: {
      scoring: 'PPR',
      superflex: true,
      tePremium: false,
      tePremiumMultiplier: 1.5,
      leagueSize: 12,
      starters: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 1 }
    },
    category: 'superflex'
  },
  {
    id: 'te-premium-trade',
    title: 'TE Premium Trade',
    description: 'Elite TE vs high-end WR2 in TE Premium league',
    teamA: ['player:4'], // Travis Kelce
    teamB: ['player:5', 'player:6'], // Stefon Diggs + 2025 1st
    settings: {
      scoring: 'PPR',
      superflex: false,
      tePremium: true,
      tePremiumMultiplier: 1.5,
      leagueSize: 12,
      starters: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 0 }
    },
    category: 'te-premium'
  },
  {
    id: 'rebuild-vs-win-now',
    title: 'Rebuild vs Win-Now',
    description: 'Veteran RB for young prospects and picks',
    teamA: ['player:7'], // Derrick Henry
    teamB: ['player:8', 'player:9', 'player:10'], // Breece Hall + 2025 1st + 2026 2nd
    settings: {
      scoring: 'PPR',
      superflex: false,
      tePremium: false,
      tePremiumMultiplier: 1.5,
      leagueSize: 12,
      starters: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 0 }
    },
    category: 'rebuild-vs-win-now'
  },
  {
    id: 'balanced-trade',
    title: 'Balanced Trade',
    description: 'Fair trade with similar value on both sides',
    teamA: ['player:11', 'player:12'], // Davante Adams + 2025 2nd
    teamB: ['player:13', 'player:14'], // Tyreek Hill + 2025 3rd
    settings: {
      scoring: 'PPR',
      superflex: false,
      tePremium: false,
      tePremiumMultiplier: 1.5,
      leagueSize: 12,
      starters: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 0 }
    },
    category: 'balanced'
  }
]

export function getExampleTradeById(id: string): ExampleTrade | undefined {
  return exampleTrades.find(trade => trade.id === id)
}

export function getExampleTradesByCategory(category: string): ExampleTrade[] {
  return exampleTrades.filter(trade => trade.category === category)
}
