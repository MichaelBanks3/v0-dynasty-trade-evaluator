import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { formatSettingsForDisplay } from '@/lib/settings'

interface TradePageProps {
  params: { id: string }
}

async function TradeContent({ tradeId }: { tradeId: string }) {
  const { userId } = await auth()
  if (!userId) {
    notFound()
  }

  // Get trade by ID
  const trade = await prisma.trade.findFirst({
    where: {
      id: tradeId,
      userId: userId
    }
  })

  if (!trade) {
    notFound()
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'FAVORS_A': return <TrendingUp className="h-4 w-4 text-blue-400" />
      case 'FAVORS_B': return <TrendingDown className="h-4 w-4 text-purple-400" />
      case 'FAIR': return <Minus className="h-4 w-4 text-green-400" />
      default: return <Minus className="h-4 w-4 text-subtext" />
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'FAVORS_A': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'FAVORS_B': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'FAIR': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-muted/20 text-muted border-[color:var(--border)]'
    }
  }

  // Parse trade payload
  const payload = trade.payload as any
  const teamAAssets = payload?.teamA || []
  const teamBAssets = payload?.teamB || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-text">Trade Details</h1>
            <p className="text-subtext mt-2">
              Created {new Date(trade.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="capitalize bg-muted/50 border-border text-text">
          {trade.status.toLowerCase()}
        </Badge>
      </div>

      {/* Trade Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-text">Trade Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-text">{trade.teamATotal?.toLocaleString() || 0}</div>
              <div className="text-sm text-subtext">Team A Total</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                {getVerdictIcon(trade.verdict)}
                <Badge className={getVerdictColor(trade.verdict)}>
                  {trade.verdict.replace('_', ' ')}
                </Badge>
              </div>
              <div className="text-sm text-subtext mt-2">Verdict</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text">{trade.teamBTotal?.toLocaleString() || 0}</div>
              <div className="text-sm text-subtext">Team B Total</div>
            </div>
          </div>

          {trade.deltaPct && (
            <div className="text-center">
              <div className="text-lg font-semibold text-text">
                {Math.abs(trade.deltaPct).toFixed(1)}% difference
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Assets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team A */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-text">Team A Assets</CardTitle>
          </CardHeader>
          <CardContent>
            {teamAAssets.length > 0 ? (
              <div className="space-y-2">
                {teamAAssets.map((asset: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{asset.label || `Asset ${index + 1}`}</span>
                    <Badge variant="outline">{Number(asset.value || 0).toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-subtext">No assets</div>
            )}
          </CardContent>
        </Card>

        {/* Team B */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-text">Team B Assets</CardTitle>
          </CardHeader>
          <CardContent>
            {teamBAssets.length > 0 ? (
              <div className="space-y-2">
                {teamBAssets.map((asset: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{asset.label || `Asset ${index + 1}`}</span>
                    <Badge variant="outline">{Number(asset.value || 0).toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-subtext">No assets</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      {trade.settings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-text">League Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="font-mono text-xs bg-muted/50 border-border text-subtext">
              {formatSettingsForDisplay(trade.settings)}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button asChild className="bg-accent text-accent-contrast hover:bg-accent/90">
          <Link href={`/t/${trade.slug}`}>
            View Full Analysis
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/trade">
            Create New Trade
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function TradePage({ params }: TradePageProps) {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-subtext">Loading trade...</p>
        </div>
      </div>
    }>
      <TradeContent tradeId={params.id} />
    </Suspense>
  )
}
