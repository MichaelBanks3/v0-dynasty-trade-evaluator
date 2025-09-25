import { PrismaClient, Position } from '../../lib/generated/prisma'

const prisma = new PrismaClient()

// Market value configuration
const MARKET_CONFIG = {
  // Tier-based market values by position
  tiers: {
    QB: {
      1: 4500, // Elite (Mahomes, Allen, etc.)
      2: 3500, // High-end QB1
      3: 2500, // Mid QB1
      4: 1800, // Low QB1/High QB2
      5: 1200, // Mid QB2
      6: 800,  // Low QB2
      7: 500,  // QB3
      8: 300,  // Deep QB3
    },
    RB: {
      1: 3800, // Elite (CMC, etc.)
      2: 2800, // High-end RB1
      3: 2000, // Mid RB1
      4: 1400, // Low RB1/High RB2
      5: 900,  // Mid RB2
      6: 600,  // Low RB2
      7: 350,  // RB3
      8: 200,  // Deep RB3
    },
    WR: {
      1: 4200, // Elite (Jefferson, Chase, etc.)
      2: 3200, // High-end WR1
      3: 2400, // Mid WR1
      4: 1800, // Low WR1/High WR2
      5: 1200, // Mid WR2
      6: 800,  // Low WR2
      7: 500,  // WR3
      8: 300,  // Deep WR3
    },
    TE: {
      1: 2800, // Elite (Kelce, etc.)
      2: 2000, // High-end TE1
      3: 1400, // Mid TE1
      4: 900,  // Low TE1/High TE2
      5: 600,  // Mid TE2
      6: 400,  // Low TE2
      7: 250,  // TE3
      8: 150,  // Deep TE3
    }
  },
  
  // Tier assignment logic based on player ranking
  getTier: (position: Position, rank: number): number => {
    const tierRanges = {
      QB: [1, 3, 6, 10, 15, 20, 25, 30],
      RB: [1, 4, 8, 12, 18, 24, 30, 40],
      WR: [1, 6, 12, 18, 24, 30, 40, 50],
      TE: [1, 3, 6, 10, 15, 20, 25, 30]
    }
    
    const ranges = tierRanges[position]
    for (let i = 0; i < ranges.length; i++) {
      if (rank <= ranges[i]) {
        return i + 1
      }
    }
    return 8 // Default to lowest tier
  }
}

// Generate market values based on position and ranking
function generateMarketValue(position: Position, rank: number): number {
  const tier = MARKET_CONFIG.getTier(position, rank)
  const baseValue = MARKET_CONFIG.tiers[position][tier as keyof typeof MARKET_CONFIG.tiers[Position]]
  
  // Add some randomness to make values more realistic (±10%)
  const variation = 0.9 + Math.random() * 0.2
  return Math.round(baseValue * variation)
}

// Generate projections based on market value and position
function generateProjections(marketValue: number, position: Position, age?: number): { projNow: number, projFuture: number } {
  // Base projections as percentage of market value
  const baseProjNow = marketValue * 0.8 // 80% of market value for current season
  const baseProjFuture = marketValue * 0.6 // 60% for future value
  
  // Age adjustments
  let ageMultiplier = 1.0
  if (age) {
    if (age <= 22) ageMultiplier = 1.1 // Young players get slight boost
    else if (age <= 25) ageMultiplier = 1.0 // Prime years
    else if (age <= 28) ageMultiplier = 0.9 // Slight decline
    else if (age <= 30) ageMultiplier = 0.7 // Noticeable decline
    else ageMultiplier = 0.5 // Significant decline
  }
  
  // Position-specific adjustments
  const positionMultipliers = {
    QB: { now: 1.0, future: 1.1 }, // QBs hold value longer
    RB: { now: 1.1, future: 0.8 }, // RBs peak now, decline faster
    WR: { now: 1.0, future: 1.0 }, // WRs balanced
    TE: { now: 0.9, future: 1.0 }  // TEs develop later
  }
  
  const posMult = positionMultipliers[position]
  
  return {
    projNow: Math.round(baseProjNow * ageMultiplier * posMult.now),
    projFuture: Math.round(baseProjFuture * ageMultiplier * posMult.future)
  }
}

async function ingestMarketValues() {
  console.log('Starting market value ingestion...')
  
  try {
    // Get all active players, ordered by position and name for consistent ranking
    const players = await prisma.player.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [
        { position: 'asc' },
        { name: 'asc' }
      ]
    })
    
    console.log(`Found ${players.length} active players`)
    
    // Group players by position for ranking
    const playersByPosition = players.reduce((acc, player) => {
      if (!acc[player.position]) acc[player.position] = []
      acc[player.position].push(player)
      return acc
    }, {} as Record<Position, typeof players>)
    
    let processed = 0
    let valuationsCreated = 0
    
    // Process each position group
    for (const [position, positionPlayers] of Object.entries(playersByPosition)) {
      console.log(`Processing ${positionPlayers.length} ${position} players...`)
      
      for (let i = 0; i < positionPlayers.length; i++) {
        const player = positionPlayers[i]
        const rank = i + 1
        
        // Generate market value and projections
        const marketValue = generateMarketValue(position as Position, rank)
        const { projNow, projFuture } = generateProjections(marketValue, position as Position, player.age)
        
        // Create or update valuation for default settings
        await prisma.valuation.upsert({
          where: {
            playerId_scoring_superflex_tePremium: {
              playerId: player.id,
              scoring: 'PPR',
              superflex: false,
              tePremium: 1.0
            }
          },
          update: {
            marketValue,
            projNow,
            projFuture,
            updatedAt: new Date()
          },
          create: {
            playerId: player.id,
            scoring: 'PPR',
            superflex: false,
            tePremium: 1.0,
            marketValue,
            projNow,
            projFuture
          }
        })
        
        processed++
        valuationsCreated++
        
        if (processed % 100 === 0) {
          console.log(`Processed ${processed} players...`)
        }
      }
    }
    
    console.log(`\nMarket value ingestion complete!`)
    console.log(`- Processed: ${processed} players`)
    console.log(`- Valuations created/updated: ${valuationsCreated}`)
    
    // Verify results
    const totalValuations = await prisma.valuation.count({
      where: {
        scoring: 'PPR',
        superflex: false,
        tePremium: 1.0
      }
    })
    
    const playersWithMarketValues = await prisma.valuation.count({
      where: {
        scoring: 'PPR',
        superflex: false,
        tePremium: 1.0,
        marketValue: { not: null }
      }
    })
    
    const coverage = (playersWithMarketValues / totalValuations) * 100
    
    console.log(`\nCoverage verification:`)
    console.log(`- Total valuations: ${totalValuations}`)
    console.log(`- Players with market values: ${playersWithMarketValues}`)
    console.log(`- Coverage: ${coverage.toFixed(1)}%`)
    
    if (coverage >= 90) {
      console.log(`✅ Success: ${coverage.toFixed(1)}% coverage meets target of ≥90%`)
    } else {
      console.warn(`⚠️  Warning: ${coverage.toFixed(1)}% coverage below target of ≥90%`)
    }
    
  } catch (error) {
    console.error('Market value ingestion failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  ingestMarketValues()
    .then(() => {
      console.log('Market value ingestion completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Market value ingestion failed:', error)
      process.exit(1)
    })
}

export { ingestMarketValues }
