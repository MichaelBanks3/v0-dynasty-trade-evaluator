"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Star,
  Search
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TradeFinder } from '@/components/TradeFinder'

interface LeagueData {
  id: string
  name: string
  season: string
  settings: any
}

interface TeamBenchmark {
  teamId: string
  displayName: string
  userHandle: string | null
  nowIndex: number
  futureIndex: number
  depthCoverage: Record<string, number>
  flags: {
    qbGap: boolean
    thinDepth: { position: string; coverage: number }[]
    criticalGaps: string[]
    riskFlags: string[]
    ageSkew: string[]
  }
  surplus: string[]
  needs: string[]
  rank: {
    now: number
    future: number
  }
  percentile: {
    now: number
    future: number
  }
}

interface BenchmarkStats {
  totalTeams: number
  avgNowIndex: number
  avgFutureIndex: number
  duration: number
}

export default function LeaguePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const leagueId = params.leagueId as string

  const [league, setLeague] = useState<LeagueData | null>(null)
  const [benchmarks, setBenchmarks] = useState<TeamBenchmark[]>([])
  const [stats, setStats] = useState<BenchmarkStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'now' | 'future'>('now')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showTradeFinder, setShowTradeFinder] = useState(false)
  const [myTeamId, setMyTeamId] = useState<string | null>(null)

  useEffect(() => {
    if (leagueId) {
      fetchBenchmarks()
    }
  }, [leagueId])

  const fetchBenchmarks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/league/${leagueId}/benchmark`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch league benchmarks')
      }

      const data = await response.json()
      setLeague(data.league)
      setBenchmarks(data.benchmarks)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching benchmarks:', error)
      toast({
        title: "Error loading league",
        description: "Failed to load league benchmarks. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetAsMyTeam = async (teamId: string) => {
    try {
      setMyTeamId(teamId)
      // This would redirect to team profile with pre-filled data
      router.push(`/team?leagueId=${leagueId}&teamId=${teamId}`)
    } catch (error) {
      console.error('Error setting team:', error)
      toast({
        title: "Error",
        description: "Failed to set team. Please try again.",
        variant: "destructive",
      })
    }
  }

  const sortedBenchmarks = [...benchmarks].sort((a, b) => {
    const aValue = sortBy === 'now' ? a.nowIndex : a.futureIndex
    const bValue = sortBy === 'now' ? b.nowIndex : b.futureIndex
    
    if (sortOrder === 'asc') {
      return aValue - bValue
    } else {
      return bValue - aValue
    }
  })

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-600" />
    if (rank <= 3) return <Star className="h-4 w-4 text-orange-600" />
    return null
  }

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 80) return 'text-green-600'
    if (percentile >= 60) return 'text-blue-600'
    if (percentile >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!league || !benchmarks.length) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">League Not Found</h1>
            <p className="text-muted-foreground mb-4">
              This league could not be found or has no teams to benchmark.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{league.name}</h1>
            <p className="text-muted-foreground">{league.season} Season</p>
          </div>
          <div className="flex items-center gap-4">
            {league.settings && (
              <Badge variant="secondary" className="gap-2">
                <Settings className="h-3 w-3" />
                {league.settings.scoring} • {league.settings.superflex ? 'SF' : '1QB'} • {league.settings.leagueSize}-team
              </Badge>
            )}
            {myTeamId && (
              <Button 
                variant="outline" 
                onClick={() => setShowTradeFinder(!showTradeFinder)}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Find Trades
              </Button>
            )}
          </div>
        </div>

        {/* Trade Finder Panel */}
        {showTradeFinder && myTeamId && (
          <div className="mb-8">
            <TradeFinder 
              leagueId={leagueId}
              myTeamId={myTeamId}
            />
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalTeams}</div>
                    <div className="text-sm text-muted-foreground">Teams</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">{stats.avgNowIndex}</div>
                    <div className="text-sm text-muted-foreground">Avg Now Index</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">{stats.avgFutureIndex}</div>
                    <div className="text-sm text-muted-foreground">Avg Future Index</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Win-Now Index Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Win-Now Index
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Index</TableHead>
                    <TableHead>Percentile</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBenchmarks
                    .sort((a, b) => b.nowIndex - a.nowIndex)
                    .map((team, index) => (
                    <TableRow key={team.teamId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRankIcon(index + 1)}
                          <span className="font-medium">{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{team.displayName}</div>
                          {team.userHandle && (
                            <div className="text-sm text-muted-foreground">@{team.userHandle}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{team.nowIndex}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getPercentileColor(team.percentile.now)}`}>
                          {team.percentile.now}th
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSetAsMyTeam(team.teamId)}
                        >
                          Set as My Team
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Future Index Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Future Index
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Index</TableHead>
                    <TableHead>Percentile</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBenchmarks
                    .sort((a, b) => b.futureIndex - a.futureIndex)
                    .map((team, index) => (
                    <TableRow key={team.teamId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRankIcon(index + 1)}
                          <span className="font-medium">{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{team.displayName}</div>
                          {team.userHandle && (
                            <div className="text-sm text-muted-foreground">@{team.userHandle}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{team.futureIndex}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getPercentileColor(team.percentile.future)}`}>
                          {team.percentile.future}th
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSetAsMyTeam(team.teamId)}
                        >
                          Set as My Team
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Surplus/Need Matrix */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Position Surplus/Need Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>QB</TableHead>
                  <TableHead>RB</TableHead>
                  <TableHead>WR</TableHead>
                  <TableHead>TE</TableHead>
                  <TableHead>Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benchmarks.map((team) => (
                  <TableRow key={team.teamId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{team.displayName}</div>
                        {team.userHandle && (
                          <div className="text-sm text-muted-foreground">@{team.userHandle}</div>
                        )}
                      </div>
                    </TableCell>
                    {['QB', 'RB', 'WR', 'TE'].map((position) => {
                      const coverage = team.depthCoverage[position] || 0
                      const isSurplus = team.surplus.includes(position)
                      const isNeed = team.needs.includes(position)
                      
                      return (
                        <TableCell key={position}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{coverage.toFixed(1)}</span>
                            {isSurplus && (
                              <Badge variant="default" className="text-xs">Surplus</Badge>
                            )}
                            {isNeed && (
                              <Badge variant="destructive" className="text-xs">Need</Badge>
                            )}
                          </div>
                        </TableCell>
                      )
                    })}
                    <TableCell>
                      <div className="flex gap-1">
                        {team.flags.qbGap && (
                          <Badge variant="destructive" className="text-xs">QB Gap</Badge>
                        )}
                        {team.flags.criticalGaps.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {team.flags.criticalGaps.length} Critical
                          </Badge>
                        )}
                        {team.flags.thinDepth.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {team.flags.thinDepth.length} Thin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
