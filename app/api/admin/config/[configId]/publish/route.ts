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

    // Get the candidate config
    const candidateConfig = await prisma.appConfig.findUnique({
      where: { id: configId }
    })

    if (!candidateConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    if (!candidateConfig.isCandidate) {
      return NextResponse.json({ error: 'Configuration is not a candidate' }, { status: 400 })
    }

    // Deactivate current active config
    await prisma.appConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    // Activate the candidate config
    const updatedConfig = await prisma.appConfig.update({
      where: { id: configId },
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
        action: 'publish_config',
        configId,
        userId,
        details: {
          version: candidateConfig.version,
          fromCandidate: true
        }
      }
    })

    // Track publish event
    await trackEvent('config_publish', {
      userId,
      payloadHash: generatePayloadHash({ 
        configId,
        version: candidateConfig.version
      })
    })

    return NextResponse.json({
      success: true,
      config: updatedConfig
    })

  } catch (error) {
    console.error('Error publishing config:', error)
    return NextResponse.json({ 
      error: 'Failed to publish configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
