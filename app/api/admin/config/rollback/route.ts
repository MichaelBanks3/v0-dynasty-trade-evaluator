import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST - Rollback to previous configuration
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    // For testing, allow unauthenticated access
    // TODO: Add proper admin authentication in production
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { version } = body

    if (!version) {
      return NextResponse.json({ error: 'Version is required' }, { status: 400 })
    }

    // Find the config to rollback to
    const targetConfig = await prisma.appConfig.findUnique({
      where: { version }
    })

    if (!targetConfig) {
      return NextResponse.json({ error: 'Configuration version not found' }, { status: 404 })
    }

    // Deactivate all existing configs
    await prisma.appConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    // Create a new active config with the rollback version
    const rollbackConfig = await prisma.appConfig.create({
      data: {
        version: `${version}-rollback-${Date.now()}`,
        config: targetConfig.config,
        isActive: true,
        createdBy: userId || 'system'
      }
    })

    return NextResponse.json({
      success: true,
      version: rollbackConfig.version,
      message: `Successfully rolled back to version ${version}`
    })

  } catch (error) {
    console.error('Error rolling back config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
