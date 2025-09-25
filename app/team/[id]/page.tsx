import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Trophy, TrendingUp } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'

interface TeamPageProps {
  params: { id: string }
}

async function TeamContent({ teamId }: { teamId: string }) {
  const { userId } = await auth()
  if (!userId) {
    notFound()
  }

  // Get team profile
  const teamProfile = await prisma.teamProfile.findFirst({
    where: {
      id: teamId,
      userId: userId
    }
  })

  if (!teamProfile) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/trade">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trade Builder
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-text">Team Profile</h1>
            <p className="text-subtext mt-2">
              {teamProfile.teamName || 'Unnamed Team'}
            </p>
          </div>
        </div>
        <Button asChild className="bg-accent text-accent-contrast hover:bg-accent/90">
          <Link href="/team/edit">
            Edit Profile
          </Link>
        </Button>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-subtext">Timeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text capitalize">
              {teamProfile.timeline || 'Balanced'}
            </div>
            <p className="text-xs text-muted-foreground">
              Team building strategy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-subtext">Risk Tolerance</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text capitalize">
              {teamProfile.riskTolerance || 'Medium'}
            </div>
            <p className="text-xs text-muted-foreground">
              Investment approach
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-subtext">Roster Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text">
              {teamProfile.roster?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total players
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Roster */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-text">Roster</CardTitle>
        </CardHeader>
        <CardContent>
          {teamProfile.roster && teamProfile.roster.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamProfile.roster.map((player: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div>
                    <div className="font-medium text-text">{player.name || `Player ${index + 1}`}</div>
                    <div className="text-sm text-subtext">{player.position} • {player.team}</div>
                  </div>
                  <Badge variant="outline">{player.value?.toLocaleString() || 0}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-subtext">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>No players in roster</p>
              <p className="text-sm">Add players to your team profile</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Picks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-text">Draft Picks</CardTitle>
        </CardHeader>
        <CardContent>
          {teamProfile.picks && teamProfile.picks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {teamProfile.picks.map((pick: any, index: number) => (
                <div key={index} className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="font-medium text-text">{pick.year}</div>
                  <div className="text-sm text-subtext">Round {pick.round}</div>
                  <Badge variant="outline" className="mt-2">{pick.value?.toLocaleString() || 0}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-subtext">
              <p>No draft picks</p>
              <p className="text-sm">Add picks to your team profile</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function TeamPage({ params }: TeamPageProps) {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-subtext">Loading team...</p>
        </div>
      </div>
    }>
      <TeamContent teamId={params.id} />
    </Suspense>
  )
}
