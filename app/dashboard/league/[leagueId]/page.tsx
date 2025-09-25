import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, Users, Calendar } from 'lucide-react'
import { SuggestedMoves } from '@/components/dashboard/SuggestedMoves'
import { StatCard } from '@/components/ui/StatCard'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'

interface LeaguePageProps {
  params: { leagueId: string }
}

async function LeagueContent({ leagueId }: { leagueId: string }) {
  const { userId } = await auth()
  if (!userId) {
    notFound()
  }

  // Get user's league link
  const leagueLink = await prisma.leagueLink.findFirst({
    where: {
      userId: userId,
      leagueId: leagueId
    }
  })

  if (!leagueLink) {
    notFound()
  }

  // Get latest power index snapshot
  const latestSnapshot = await prisma.powerIndexSnapshot.findFirst({
    where: {
      userId: userId,
      leagueId: leagueId
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Mock suggestions for now
  const suggestions = [
    {
      type: 'buy' as const,
      player: { id: '1', name: 'Josh Allen', position: 'QB', team: 'BUF' },
      rationale: 'Elite QB production for contending teams',
      confidence: 'high' as const
    },
    {
      type: 'sell' as const,
      player: { id: '2', name: 'Veteran RB', position: 'RB', team: 'Any' },
      rationale: 'Trade aging RBs for future assets',
      confidence: 'medium' as const
    }
  ]

  return (
    <div className="space-y-6">
      {/* League Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">{leagueLink.name}</h1>
          <p className="text-subtext mt-2">{leagueLink.season} Season</p>
        </div>
        <Button 
          className="bg-accent text-accent-contrast hover:bg-accent/90"
          onClick={() => {
            fetch(`/api/sleeper/league/${leagueId}/sync`, { method: 'POST' })
              .then(() => window.location.reload())
          }}
        >
          Sync League
        </Button>
      </div>

      {/* Power Index Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Power Index"
          value={latestSnapshot?.score || 'N/A'}
          subtext="Overall team strength"
          icon={Trophy}
        />
        <StatCard
          title="League Rank"
          value={latestSnapshot?.rank ? `#${latestSnapshot.rank}` : 'N/A'}
          subtext="Out of 12 teams"
          icon={TrendingUp}
        />
        <StatCard
          title="Last Updated"
          value={latestSnapshot?.createdAt ? new Date(latestSnapshot.createdAt).toLocaleDateString() : 'Never'}
          subtext="Power index calculation"
          icon={Calendar}
        />
      </div>

      {/* Suggested Moves */}
      <SuggestedMoves suggestions={suggestions} />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-text">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-20 bg-muted/20 border-border text-text hover:bg-muted/40"
              asChild
            >
              <a href={`/trade?league=${leagueId}`}>
                <div className="text-center">
                  <div className="text-lg font-semibold">Create Trade</div>
                  <div className="text-sm text-subtext">Evaluate a trade</div>
                </div>
              </a>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 bg-muted/20 border-border text-text hover:bg-muted/40"
              asChild
            >
              <a href={`/league/${leagueId}?findTrades=true`}>
                <div className="text-center">
                  <div className="text-lg font-semibold">Find Trades</div>
                  <div className="text-sm text-subtext">Get trade suggestions</div>
                </div>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LeaguePage({ params }: LeaguePageProps) {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-subtext">Loading league...</p>
        </div>
      </div>
    }>
      <LeagueContent leagueId={params.leagueId} />
    </Suspense>
  )
}
