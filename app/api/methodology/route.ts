import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Get system status for last refresh times
    const systemStatus = await prisma.systemStatus.findMany({
      where: {
        id: { in: ['players', 'market', 'projections'] }
      }
    })

    // Get latest calibration run
    const latestCalibration = await prisma.calibrationRun.findFirst({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' }
    })

    // Get current app config (active parameters)
    const appConfig = await prisma.appConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    // Parse system status
    const lastDataRefresh = systemStatus.find(s => s.id === 'players')?.lastRefreshAt?.toISOString() || null
    const lastCalibration = latestCalibration?.completedAt?.toISOString() || null

    // Parse current weights and parameters
    let currentWeights = {
      alpha: 0.6,
      wM_now: 0.6,
      wP_now: 0.4,
      wM_future: 0.4,
      wP_future: 0.6
    }

    let ageCurves = {
      QB: { breakpoints: [26, 30, 35], multipliers: [1.0, 0.95, 0.85, 0.7] },
      RB: { breakpoints: [23, 26, 29], multipliers: [1.0, 0.9, 0.7, 0.5] },
      WR: { breakpoints: [24, 27, 30], multipliers: [1.0, 0.95, 0.85, 0.7] },
      TE: { breakpoints: [25, 28, 31], multipliers: [1.0, 0.95, 0.8, 0.6] }
    }

    let scoringMultipliers = {
      PPR: 1.0,
      Half: 0.85,
      Standard: 0.7
    }

    let calibrationMetrics = null

    if (appConfig?.config) {
      try {
        const config = JSON.parse(appConfig.config as string)
        if (config.weights) {
          currentWeights = { ...currentWeights, ...config.weights }
        }
        if (config.ageCurves) {
          ageCurves = { ...ageCurves, ...config.ageCurves }
        }
        if (config.scoringMultipliers) {
          scoringMultipliers = { ...scoringMultipliers, ...config.scoringMultipliers }
        }
      } catch (error) {
        console.error('Error parsing app config:', error)
      }
    }

    if (latestCalibration?.metrics) {
      try {
        calibrationMetrics = JSON.parse(latestCalibration.metrics as string)
      } catch (error) {
        console.error('Error parsing calibration metrics:', error)
      }
    }

    const data = {
      lastDataRefresh,
      lastCalibration,
      currentWeights,
      ageCurves,
      scoringMultipliers,
      calibrationMetrics
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Error fetching methodology data:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch methodology data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
