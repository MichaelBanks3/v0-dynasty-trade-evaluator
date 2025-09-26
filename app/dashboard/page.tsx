import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getUserTrades } from '@/lib/server/getUserTrades'
import { TradeList } from '@/components/trades/TradeList'
import { DashboardError } from '@/components/dashboard/DashboardError'
import { SiteShell } from '@/components/layout/SiteShell'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <SiteShell
      title="Dashboard"
      subtitle="Loading your trades..."
      right={<div className="h-10 w-32 theme-muted rounded animate-pulse opacity-20"></div>}
    >
      <div className="space-y-4">
        <div className="h-6 w-40 theme-muted rounded animate-pulse opacity-20"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 theme-muted rounded animate-pulse opacity-20"></div>
          ))}
        </div>
      </div>
    </SiteShell>
  )
}


// Main dashboard content component
async function DashboardContent() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      redirect('/sign-in')
    }

    const trades = await getUserTrades(userId)

    return (
      <SiteShell
        title="Dashboard"
        subtitle={`${trades.length} recent trades`}
        right={
          <Link href="/trade" className="btn-primary focus-ring">
            <Plus className="h-4 w-4 mr-2" />
            New Trade
          </Link>
        }
      >
        {/* Recent Trades */}
        <TradeList trades={trades} />
      </SiteShell>
    )
  } catch (error) {
    console.error('[DASHBOARD]', error)
    return <DashboardError error="Failed to load dashboard data" />
  }
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}