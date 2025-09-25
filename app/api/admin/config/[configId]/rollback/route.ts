import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { configId } = params

    // Get the current active config
    const activeConfig = await prisma.appConfig.findUnique({
      where: { id: configId }
    })

    if (!activeConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    if (!activeConfig.isActive) {
      return NextResponse.json({ error: 'Configuration is not active' }, { status: 400 })
    }

    // Find the previous config to rollback to
    const previousConfig = await prisma.appConfig.findFirst({
      where: {
        id: { not: configId },
        createdAt: { lt: activeConfig.createdAt }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!previousConfig) {
      return NextResponse.json({ error: 'No previous configuration found to rollback to' }, { status: 400 })
    }

    // Deactivate current config
    await prisma.appConfig.update({
      where: { id: configId },
      data: { isActive: false }
    })

    // Activate previous config
    const rolledBackConfig = await prisma.appConfig.update({
      where: { id: previousConfig.id },
      data: {
        isActive: true,
        isCandidate: false,
        rolloutPercentage: 100,
        publishedAt: new Date(),
        publishedBy: userId
      }
    })

    // Log admin action
    await prisma.adminAction.create({
      data: {
        action: 'rollback_config',
        configId,
        userId,
        details: {
          fromVersion: activeConfig.version,
          toVersion: previousConfig.version
        }
      }
    })

    // Track rollback event
    await trackEvent('config_rollback', {
      userId,
      payloadHash: generatePayloadHash({ 
        fromConfigId: configId,
        toConfigId: previousConfig.id,
        fromVersion: activeConfig.version,
        toVersion: previousConfig.version
      })
    })

    return NextResponse.json({
      success: true,
      config: rolledBackConfig,
      previousConfig: activeConfig
    })

  } catch (error) {
    console.error('Error rolling back config:', error)
    return NextResponse.json({ 
      error: 'Failed to rollback configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
