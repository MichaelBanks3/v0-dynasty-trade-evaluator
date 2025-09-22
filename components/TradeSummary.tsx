"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface TradeSummaryProps {
  teamATotal: number
  teamBTotal: number
}

export function TradeSummary({ teamATotal, teamBTotal }: TradeSummaryProps) {
  const difference = Math.abs(teamATotal - teamBTotal)
  const percentageDiff = teamATotal > 0 && teamBTotal > 0 ? (difference / Math.max(teamATotal, teamBTotal)) * 100 : 0

  const getFairnessResult = () => {
    if (percentageDiff < 5) return { text: "Even", variant: "secondary" as const, icon: Minus }
    if (percentageDiff < 15) {
      return {
        text: teamATotal > teamBTotal ? "Slightly Favors Team A" : "Slightly Favors Team B",
        variant: "outline" as const,
        icon: teamATotal > teamBTotal ? TrendingUp : TrendingDown,
      }
    }
    return {
      text: teamATotal > teamBTotal ? "Leans Team A" : "Leans Team B",
      variant: "default" as const,
      icon: teamATotal > teamBTotal ? TrendingUp : TrendingDown,
    }
  }

  const fairness = getFairnessResult()
  const IconComponent = fairness.icon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Trade Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Team A Total</span>
            <Badge variant="outline">{Math.round(teamATotal)}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Team B Total</span>
            <Badge variant="outline">{Math.round(teamBTotal)}</Badge>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Fairness</span>
              <div className="flex items-center space-x-2">
                <IconComponent className="h-4 w-4" />
                <Badge variant={fairness.variant}>{fairness.text}</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
