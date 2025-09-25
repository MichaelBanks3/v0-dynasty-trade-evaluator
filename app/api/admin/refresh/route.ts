import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { ingestPlayers } from '@/scripts/ingest/sleeper'
import { seedPicks } from '@/scripts/ingest/picks'
import { ingestMarketValues } from '@/scripts/ingest/market-values'
import { computeValuations } from '@/scripts/ingest/compute-valuations'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Admin user IDs (you can add your Clerk user ID here)
const ADMIN_USER_IDS = [
  // Add your Clerk user ID here for testing
  // 'user_2abc123...'
]

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    // For testing, allow unauthenticated access
    // TODO: Add proper admin authentication in production
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const startTime = Date.now()

    try {
      console.log('Starting weekly data refresh...')

      // Step 1: Ingest players from Sleeper
      console.log('Step 1: Ingesting players from Sleeper...')
      await ingestPlayers()

      // Step 2: Seed picks
      console.log('Step 2: Seeding rookie picks...')
      await seedPicks()

      // Step 3: Ingest market values
      console.log('Step 3: Ingesting market values...')
      await ingestMarketValues()

      // Step 4: Compute valuations
      console.log('Step 4: Computing valuations...')
      await computeValuations()

      // Get final counts
      const playerCount = await prisma.player.count()
      const valuationCount = await prisma.valuation.count()
      const pickCount = await prisma.pick.count()

      const durationMs = Date.now() - startTime

      console.log(`Weekly refresh completed in ${durationMs}ms`)
      console.log(`- Players: ${playerCount}`)
      console.log(`- Valuations: ${valuationCount}`)
      console.log(`- Picks: ${pickCount}`)

      return NextResponse.json({
        success: true,
        durationMs,
        playerCount,
        valuationCount,
        pickCount,
        message: 'Weekly refresh completed successfully'
      })

    } catch (error) {
      const durationMs = Date.now() - startTime
      console.error('Weekly refresh failed:', error)
      throw error
    }

  } catch (error) {
    console.error('Admin refresh error:', error)
    return NextResponse.json({ 
      error: 'Refresh failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
