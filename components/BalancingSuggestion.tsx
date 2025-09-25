"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, TrendingDown } from "lucide-react"

interface BalancingSuggestionProps {
  suggestion?: string
  delta: number
  threshold?: number
}

export function BalancingSuggestion({ suggestion, delta, threshold = 0.1 }: BalancingSuggestionProps) {
  // Only show suggestion if delta is within threshold (e.g., within 10%)
  const shouldShow = Math.abs(delta) <= threshold && suggestion

  if (!shouldShow) {
    return null
  }

  const isTeamAFavored = delta > 0
  const deltaPercentage = Math.abs(delta) * 100

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-amber-900">Balancing Suggestion</h4>
              <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                {deltaPercentage.toFixed(1)}% difference
              </Badge>
            </div>
            <p className="text-sm text-amber-800 mb-2">{suggestion}</p>
            <div className="flex items-center gap-2 text-xs text-amber-700">
              {isTeamAFavored ? (
                <>
                  <TrendingUp className="h-3 w-3" />
                  <span>Team A has slight advantage</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3" />
                  <span>Team B has slight advantage</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
