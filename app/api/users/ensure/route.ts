import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in database
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error ensuring user:', error)
    return NextResponse.json({ error: 'Failed to ensure user' }, { status: 500 })
  }
}
