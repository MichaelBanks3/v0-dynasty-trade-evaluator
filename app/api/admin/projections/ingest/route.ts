import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProjectionsFeed, type ProjectionSource } from '@/lib/projections-feed'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Admin-only endpoint for ingesting projections
export async function POST(request: NextRequest) {
  const { userId } = auth()
  
  // Check if user is admin (simplified check - in production, use proper admin role)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { source, data, type = 'csv' } = body

    if (!source || !data) {
      return NextResponse.json({ 
        error: 'Missing required fields: source and data' 
      }, { status: 400 })
    }

    // Create projection source
    const projectionSource: ProjectionSource = {
      id: source.id || 'manual',
      name: source.name || 'Manual Upload',
      url: source.url,
      lastUpdated: new Date(),
      version: source.version || `v${Date.now()}`
    }

    let result

    if (type === 'csv') {
      result = await ProjectionsFeed.fromCSV(data, projectionSource)
    } else if (type === 'api') {
      result = await ProjectionsFeed.fromAPI(data, projectionSource)
    } else {
      return NextResponse.json({ 
        error: 'Invalid type. Must be "csv" or "api"' 
      }, { status: 400 })
    }

    // Track ingestion event
    await trackEvent('projections_ingest', {
      userId,
      payloadHash: generatePayloadHash({ 
        source: projectionSource.name,
        totalProcessed: result.totalProcessed,
        matched: result.matched
      })
    })

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Error ingesting projections:', error)
    return NextResponse.json({ 
      error: 'Failed to ingest projections',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check projection stats
export async function GET() {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { getProjectionStats } = await import('@/lib/projections-feed')
    const stats = await getProjectionStats()

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error getting projection stats:', error)
    return NextResponse.json({ 
      error: 'Failed to get projection stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
