import { PrismaClient } from '../../lib/generated/prisma'

const prisma = new PrismaClient()

// Baseline value curve (descending by round, mild discount by future year)
function calculateBaselineValue(year: number, round: number): number {
  const currentYear = new Date().getFullYear()
  const yearDiscount = Math.pow(0.9, year - currentYear) // 10% discount per future year
  
  // Base values by round (roughly following market)
  const baseValues = {
    1: 1000,
    2: 400,
    3: 150,
    4: 50
  }
  
  return Math.round(baseValues[round as keyof typeof baseValues] * yearDiscount)
}

function getRoundLabel(round: number): string {
  const suffixes = ['st', 'nd', 'rd', 'th']
  return `${round}${suffixes[round - 1] || 'th'}`
}

async function seedPicks() {
  console.log('Seeding rookie draft picks...')
  
  try {
    const years = [2025, 2026, 2027]
    const rounds = [1, 2, 3, 4]
    
    let created = 0
    
    for (const year of years) {
      for (const round of rounds) {
        const baselineValue = calculateBaselineValue(year, round)
        const label = `${year} ${getRoundLabel(round)}`
        
        await prisma.pick.upsert({
          where: { 
            year_round: { year, round }
          },
          update: {
            baselineValue,
            label,
            compositeValue: baselineValue, // Initially same as baseline
          },
          create: {
            year,
            round,
            baselineValue,
            label,
            compositeValue: baselineValue,
          },
        })
        
        created++
      }
    }
    
    console.log(`✅ Created/updated ${created} draft picks`)
    
    // Verify results
    const totalPicks = await prisma.pick.count()
    console.log(`Database now contains ${totalPicks} draft picks`)
    
    // Show sample
    const samplePicks = await prisma.pick.findMany({
      orderBy: [{ year: 'asc' }, { round: 'asc' }],
      take: 8
    })
    
    console.log('\nSample picks:')
    samplePicks.forEach(pick => {
      console.log(`- ${pick.label}: ${pick.baselineValue} points`)
    })
    
  } catch (error) {
    console.error('Picks seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  seedPicks()
    .then(() => {
      console.log('Picks seeding completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Picks seeding failed:', error)
      process.exit(1)
    })
}

export { seedPicks }
