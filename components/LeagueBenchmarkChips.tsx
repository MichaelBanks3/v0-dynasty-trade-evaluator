"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  Star
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

interface LeagueBenchmarkChipsProps {
  leagueId?: string
  teamId?: string
  className?: string
}

interface LeagueBenchmark {
  teamId: string
  displayName: string
  nowIndex: number
  futureIndex: number
  rank: {
    now: number
    future: number
  }
  percentile: {
    now: number
    future: number
  }
}

export function LeagueBenchmarkChips({ leagueId, teamId, className }: LeagueBenchmarkChipsProps) {
  const [benchmark, setBenchmark] = useState<LeagueBenchmark | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (leagueId && teamId) {
      fetchBenchmark()
    }
  }, [leagueId, teamId])

  const fetchBenchmark = async () => {
    if (!leagueId || !teamId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/league/${leagueId}/benchmark`)
      
      if (response.ok) {
        const data = await response.json()
        const teamBenchmark = data.benchmarks.find((b: LeagueBenchmark) => b.teamId === teamId)
        
        if (teamBenchmark) {
          setBenchmark(teamBenchmark)
          
          // Track benchmark view
          await trackEvent('results_league_chips_view', {
            payloadHash: generatePayloadHash({ 
              leagueId: leagueId.substring(0, 8),
              teamId: teamId.substring(0, 8)
            })
          })
        }
      }
    } catch (error) {
      console.error('Error fetching league benchmark:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-3 w-3 text-yellow-600" />
    if (rank <= 3) return <Star className="h-3 w-3 text-orange-600" />
    return null
  }

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 80) return 'text-green-600'
    if (percentile >= 60) return 'text-blue-600'
    if (percentile >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!leagueId || !teamId || loading) {
    return null
  }

  if (!benchmark) {
    return null
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Now Rank:</span>
              <div className="flex items-center gap-1">
                {getRankIcon(benchmark.rank.now)}
                <span className="font-mono text-sm">{benchmark.rank.now}</span>
              </div>
              <span className={`text-xs ${getPercentileColor(benchmark.percentile.now)}`}>
                ({benchmark.percentile.now}th pct)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Future Rank:</span>
              <div className="flex items-center gap-1">
                {getRankIcon(benchmark.rank.future)}
                <span className="font-mono text-sm">{benchmark.rank.future}</span>
              </div>
              <span className={`text-xs ${getPercentileColor(benchmark.percentile.future)}`}>
                ({benchmark.percentile.future}th pct)
              </span>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm"
            asChild
            className="gap-2"
          >
            <a href={`/league/${leagueId}`}>
              <ExternalLink className="h-3 w-3" />
              View League
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
