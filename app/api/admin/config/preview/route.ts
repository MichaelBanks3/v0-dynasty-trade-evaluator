import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST - Preview configuration changes
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    // For testing, allow unauthenticated access
    // TODO: Add proper admin authentication in production
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { config } = body

    if (!config) {
      return NextResponse.json({ error: 'Configuration is required' }, { status: 400 })
    }

    // Simulate a test evaluation with the new config
    // In a real implementation, this would run a sample evaluation
    const testResult = {
      message: 'Configuration preview successful',
      sampleEvaluation: {
        teamA: { compositeValue: 1000 },
        teamB: { compositeValue: 950 },
        verdict: 'FAVORS_A',
        explanation: 'Team A has a slight advantage based on the new configuration'
      },
      configApplied: {
        weights: config.weights,
        multipliers: config.multipliers,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(testResult)

  } catch (error) {
    console.error('Error previewing config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
