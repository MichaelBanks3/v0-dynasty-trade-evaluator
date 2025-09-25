"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, ArrowRight, Lightbulb } from "lucide-react"

interface SuggestedMove {
  type: "buy" | "sell"
  player: {
    name: string
    position: string
    team: string
    value: number
  }
  rationale: string
  confidence: "high" | "medium" | "low"
}

interface SuggestedMovesProps {
  moves: SuggestedMove[]
  className?: string
}

export function SuggestedMoves({ moves, className }: SuggestedMovesProps) {
  const getTypeIcon = (type: "buy" | "sell") => {
    return type === "buy" ? (
      <TrendingUp className="h-4 w-4 text-green-400" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-400" />
    )
  }

  const getTypeColor = (type: "buy" | "sell") => {
    return type === "buy" 
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : "bg-red-500/20 text-red-400 border-red-500/30"
  }

  const getConfidenceColor = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high":
        return "bg-green-500/20 text-green-400"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400"
      case "low":
        return "bg-gray-500/20 text-gray-400"
    }
  }

  if (moves.length === 0) {
    return (
      <Card className={`bg-surface border-border/50 ${className}`}>
        <CardHeader>
          <CardTitle className="text-lg text-text flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warn" />
            Suggested Moves
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-subtext">
            <div className="mb-4">No suggestions available</div>
            <div className="text-sm">Connect your Sleeper account and sync league data to get personalized trade suggestions.</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-surface border-border/50 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg text-text flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-warn" />
          Suggested Moves
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {moves.slice(0, 3).map((move, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/30">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getTypeIcon(move.type)}
                  <Badge className={getTypeColor(move.type)}>
                    {move.type.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <div className="font-medium text-text">
                    {move.player.name}
                  </div>
                  <div className="text-sm text-subtext">
                    {move.player.position} • {move.player.team}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-text">
                    {move.player.value.toLocaleString()}
                  </div>
                  <Badge className={getConfidenceColor(move.confidence)}>
                    {move.confidence}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-subtext hover:text-text"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border/30">
          <Button
            variant="outline"
            className="w-full text-subtext hover:text-text"
          >
            View All Suggestions
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
