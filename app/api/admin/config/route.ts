import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET all configurations
export async function GET() {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const configs = await prisma.appConfig.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      configs
    })

  } catch (error) {
    console.error('Error fetching configs:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch configurations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST new configuration
export async function POST(request: NextRequest) {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { config, version, isCandidate = false, rolloutPercentage = 0 } = body

    if (!config || !version) {
      return NextResponse.json({ 
        error: 'Missing required fields: config and version' 
      }, { status: 400 })
    }

    // If this is going to be active, deactivate current active config
    if (!isCandidate) {
      await prisma.appConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      })
    }

    // If this is going to be a candidate, deactivate current candidate
    if (isCandidate) {
      await prisma.appConfig.updateMany({
        where: { isCandidate: true },
        data: { isCandidate: false }
      })
    }

    const newConfig = await prisma.appConfig.create({
      data: {
        version,
        config: JSON.stringify(config),
        isActive: !isCandidate,
        isCandidate,
        rolloutPercentage,
        createdBy: userId
      }
    })

    // Track config creation
    await trackEvent('config_create', {
      userId,
      payloadHash: generatePayloadHash({ 
        version,
        isCandidate,
        rolloutPercentage
      })
    })

    return NextResponse.json({
      success: true,
      config: newConfig
    })

  } catch (error) {
    console.error('Error creating config:', error)
    return NextResponse.json({ 
      error: 'Failed to create configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}