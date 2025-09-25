import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { LeagueSettings, DEFAULT_SETTINGS, validateSettings } from '@/lib/settings'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET - Retrieve user settings
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      // Return default settings for anonymous users
      return NextResponse.json(DEFAULT_SETTINGS)
    }
    
    // Get user settings from database
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    })
    
    if (!userSettings) {
      // Return default settings if user has no saved settings
      return NextResponse.json(DEFAULT_SETTINGS)
    }
    
    // Validate and return settings
    const settings = validateSettings(userSettings.settings as LeagueSettings)
    return NextResponse.json(settings)
    
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

// POST - Save user settings
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const settings = validateSettings(body as LeagueSettings)
    
    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    })
    
    // Upsert user settings
    await prisma.userSettings.upsert({
      where: { userId },
      update: {
        settings: settings as any,
        updatedAt: new Date()
      },
      create: {
        userId,
        settings: settings as any
      }
    })
    
    return NextResponse.json({ success: true, settings })
    
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
