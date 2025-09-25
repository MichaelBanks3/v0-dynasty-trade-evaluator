import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAnalyticsSummary } from '@/lib/analytics'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Get basic counts
    const playerCount = await prisma.player.count()
    const valuationCount = await prisma.valuation.count()
    const pickCount = await prisma.pick.count()
    const tradeCount = await prisma.trade.count()

    // Get system status
    let systemStatus = null
    try {
      systemStatus = await prisma.systemStatus.findFirst({
        orderBy: { updatedAt: 'desc' }
      })
    } catch (error) {
      // SystemStatus table might not exist yet
      console.log('SystemStatus table not available yet')
    }

    // Get recent refresh logs
    let refreshLogs = []
    try {
      refreshLogs = await prisma.refreshLog.findMany({
        orderBy: { startedAt: 'desc' },
        take: 5
      })
    } catch (error) {
      // RefreshLog table might not exist yet
      console.log('RefreshLog table not available yet')
    }

    // Get analytics summary
    const analytics = await getAnalyticsSummary()

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      counts: {
        players: playerCount,
        valuations: valuationCount,
        picks: pickCount,
        trades: tradeCount
      },
      systemStatus,
      recentRefreshLogs: refreshLogs,
      analytics
    })

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
