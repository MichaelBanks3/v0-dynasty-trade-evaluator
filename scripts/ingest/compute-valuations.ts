import { PrismaClient } from '../../lib/generated/prisma'
import { calculatePlayerValuation, calculatePickValuation } from '../../lib/valuation'

const prisma = new PrismaClient()

async function computeValuations() {
  console.log('Starting composite valuation computation...')
  
  try {
    // Get all valuations that need computation
    const valuations = await prisma.valuation.findMany({
      where: {
        scoring: 'PPR',
        superflex: false,
        tePremium: 1.0,
        marketValue: { not: null },
        projNow: { not: null },
        projFuture: { not: null }
      },
      include: {
        player: true
      }
    })
    
    console.log(`Found ${valuations.length} valuations to compute`)
    
    let updated = 0
    
    for (const valuation of valuations) {
      const { player } = valuation
      
      // Calculate composite valuation
      const result = calculatePlayerValuation(
        valuation.marketValue!,
        valuation.projNow!,
        valuation.projFuture!,
        player.position,
        player.age,
        player.status
      )
      
      // Update the valuation record
      await prisma.valuation.update({
        where: { id: valuation.id },
        data: {
          compositeValue: result.compositeValue,
          nowScore: result.nowScore,
          futureScore: result.futureScore,
          ageAdjustment: result.ageAdjustment,
          riskAdjustment: result.riskAdjustment,
          updatedAt: new Date()
        }
      })
      
      updated++
      
      if (updated % 100 === 0) {
        console.log(`Computed ${updated} valuations...`)
      }
    }
    
    console.log(`\nValuation computation complete!`)
    console.log(`- Updated: ${updated} valuations`)
    
    // Update pick valuations
    console.log('\nUpdating pick valuations...')
    
    const picks = await prisma.pick.findMany()
    let picksUpdated = 0
    
    for (const pick of picks) {
      const compositeValue = calculatePickValuation(pick.year, pick.round, pick.baselineValue)
      
      await prisma.pick.update({
        where: { id: pick.id },
        data: {
          compositeValue,
          marketValue: pick.baselineValue // Use baseline as market value for now
        }
      })
      
      picksUpdated++
    }
    
    console.log(`- Updated: ${picksUpdated} picks`)
    
    // Verify results
    const totalValuations = await prisma.valuation.count({
      where: {
        scoring: 'PPR',
        superflex: false,
        tePremium: 1.0
      }
    })
    
    const computedValuations = await prisma.valuation.count({
      where: {
        scoring: 'PPR',
        superflex: false,
        tePremium: 1.0,
        compositeValue: { not: null }
      }
    })
    
    const coverage = (computedValuations / totalValuations) * 100
    
    console.log(`\nCoverage verification:`)
    console.log(`- Total valuations: ${totalValuations}`)
    console.log(`- Computed valuations: ${computedValuations}`)
    console.log(`- Coverage: ${coverage.toFixed(1)}%`)
    
    if (coverage >= 90) {
      console.log(`✅ Success: ${coverage.toFixed(1)}% coverage meets target of ≥90%`)
    } else {
      console.warn(`⚠️  Warning: ${coverage.toFixed(1)}% coverage below target of ≥90%`)
    }
    
  } catch (error) {
    console.error('Valuation computation failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  computeValuations()
    .then(() => {
      console.log('Valuation computation completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Valuation computation failed:', error)
      process.exit(1)
    })
}

export { computeValuations }
