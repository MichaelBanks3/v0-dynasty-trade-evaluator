import { prisma } from '@/lib/prisma'

export interface UserTrade {
  id: string
  createdAt: Date
  verdict: string | null
  totalA: number
  totalB: number
}

export async function getUserTrades(userId: string): Promise<UserTrade[]> {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { 
        id: true, 
        createdAt: true, 
        verdict: true, 
        totalA: true, 
        totalB: true 
      }
    })

    return trades
  } catch (error) {
    console.error('[DASHBOARD] Error fetching user trades:', error)
    throw new Error('Failed to fetch trades')
  }
}
