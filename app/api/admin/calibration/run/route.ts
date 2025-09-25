import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CalibrationEngine } from '@/lib/calibration-engine'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Admin-only endpoint for running calibration
export async function POST(request: NextRequest) {
  const { userId } = auth()
  
  // Check if user is admin (simplified check - in production, use proper admin role)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const engine = new CalibrationEngine()
    
    // Track calibration start
    await trackEvent('calibration_start', {
      userId,
      payloadHash: generatePayloadHash({ timestamp: Date.now() })
    })

    // Run calibration (this is a long-running operation)
    const result = await engine.runCalibration()

    // Track calibration completion
    await trackEvent('calibration_complete', {
      userId,
      payloadHash: generatePayloadHash({ 
        runId: result.id,
        status: result.status,
        overallRho: result.metrics?.overallRho
      })
    })

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Error running calibration:', error)
    
    // Track calibration failure
    await trackEvent('calibration_failed', {
      userId,
      payloadHash: generatePayloadHash({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    })

    return NextResponse.json({ 
      error: 'Failed to run calibration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check calibration status
export async function GET() {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/db')
    
    const latestRun = await prisma.calibrationRun.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    const allRuns = await prisma.calibrationRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json({
      success: true,
      latestRun,
      recentRuns: allRuns
    })

  } catch (error) {
    console.error('Error getting calibration status:', error)
    return NextResponse.json({ 
      error: 'Failed to get calibration status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
