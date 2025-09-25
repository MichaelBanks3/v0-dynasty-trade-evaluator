import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const saveTradeSchema = z.object({
  sideAPlayerIds: z.array(z.string()),
  sideBPlayerIds: z.array(z.string()),
  totalA: z.number(),
  totalB: z.number(),
  verdict: z.string()
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = saveTradeSchema.parse(body)

    // Ensure user exists in database
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    })

    // Save trade to database
    const trade = await prisma.trade.create({
      data: {
        userId,
        sideAPlayerIds: validatedData.sideAPlayerIds,
        sideBPlayerIds: validatedData.sideBPlayerIds,
        totalA: validatedData.totalA,
        totalB: validatedData.totalB,
        verdict: validatedData.verdict
      }
    })

    return NextResponse.json({ ok: true, id: trade.id })
  } catch (error) {
    console.error('Error saving trade:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to save trade' }, { status: 500 })
  }
}