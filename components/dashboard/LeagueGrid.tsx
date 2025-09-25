"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/StatCard"
import { TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw } from "lucide-react"
import Link from "next/link"

interface LeagueData {
  id: string
  name: string
  season: string
  sport: string
  rank?: number
  score?: number
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  lastUpdated?: string
}

interface LeagueGridProps {
  leagues: LeagueData[]
  onRefresh?: (leagueId: string) => void
  className?: string
}

export function LeagueGrid({ leagues, onRefresh, className }: LeagueGridProps) {
  const getTrendIcon = (trend?: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-400" />
      default:
        return <Minus className="h-4 w-4 text-subtext" />
    }
  }

  const getTrendColor = (trend?: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-green-400"
      case "down":
        return "text-red-400"
      default:
        return "text-subtext"
    }
  }

  if (leagues.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-subtext mb-4">No leagues connected</div>
        <Button asChild className="bg-accent text-accent-contrast hover:bg-accent/90">
          <Link href="/settings">Connect Sleeper Account</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {leagues.map((league) => (
        <Card key={league.id} className="bg-surface border-border/50 hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-text truncate">
                {league.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRefresh(league.id)}
                    className="h-8 w-8 p-0 text-subtext hover:text-text"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0 text-subtext hover:text-text"
                >
                  <Link href={`/dashboard/league/${league.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-muted/50 border-border">
                {league.season} • {league.sport.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="Power Index"
                value={league.score ? league.score.toFixed(1) : "—"}
                subtext="Score"
                className="bg-muted/20"
              />
              <StatCard
                title="Rank"
                value={league.rank ? `#${league.rank}` : "—"}
                subtext="of 12"
                trend={league.trend}
                trendValue={league.trendValue}
                className="bg-muted/20"
              />
            </div>
            {league.lastUpdated && (
              <div className="mt-3 text-xs text-subtext">
                Updated {new Date(league.lastUpdated).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
