import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = await request.json()
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Fetch user data from Sleeper API
    const sleeperResponse = await fetch(`https://api.sleeper.app/v1/user/${username}`)
    if (!sleeperResponse.ok) {
      return NextResponse.json({ error: 'Sleeper user not found' }, { status: 404 })
    }

    const sleeperUser = await sleeperResponse.json()
    if (!sleeperUser.user_id) {
      return NextResponse.json({ error: 'Invalid Sleeper user data' }, { status: 400 })
    }

    // Update user with Sleeper info
    await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        sleeperUserId: sleeperUser.user_id,
        sleeperUsername: username,
      },
      create: {
        clerkId: userId,
        sleeperUserId: sleeperUser.user_id,
        sleeperUsername: username,
      },
    })

    return NextResponse.json({ 
      success: true, 
      sleeperUserId: sleeperUser.user_id,
      displayName: sleeperUser.display_name || username
    })

  } catch (error) {
    console.error('Sleeper connect error:', error)
    return NextResponse.json({ error: 'Failed to connect Sleeper account' }, { status: 500 })
  }
}
