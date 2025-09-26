"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Target, TrendingUp, Users } from "lucide-react"

interface RecommendationsCardProps {
  suggestion?: string
  teamProfile?: any
  delta: number
}

export function RecommendationsCard({ suggestion, teamProfile, delta }: RecommendationsCardProps) {
  // Generate recommendations based on the trade analysis
  const generateRecommendations = () => {
    const recommendations = []
    
    if (suggestion) {
      recommendations.push({
        icon: Lightbulb,
        text: suggestion,
        type: 'suggestion'
      })
    }

    // Add context-aware recommendations
    if (Math.abs(delta) > 0.1) {
      if (delta > 0) {
        recommendations.push({
          icon: TrendingUp,
          text: "Consider adding a future pick to Team B to balance the trade",
          type: 'balance'
        })
      } else {
        recommendations.push({
          icon: TrendingUp,
          text: "Consider adding a future pick to Team A to balance the trade",
          type: 'balance'
        })
      }
    }

    // Add team profile recommendations if available
    if (teamProfile) {
      if (teamProfile.timeline === 'contend') {
        recommendations.push({
          icon: Target,
          text: "Focus on win-now players to maximize your championship window",
          type: 'strategy'
        })
      } else if (teamProfile.timeline === 'rebuild') {
        recommendations.push({
          icon: TrendingUp,
          text: "Prioritize young talent and future draft capital",
          type: 'strategy'
        })
      }
    }

    return recommendations.slice(0, 3) // Limit to 3 recommendations
  }

  const recommendations = generateRecommendations()

  if (!teamProfile && recommendations.length === 0) {
    return (
      <Card data-testid="result-recos">
        <CardHeader>
          <CardTitle className="text-lg">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 text-muted" />
            </div>
            <div>
              <h3 className="font-semibold text-fg mb-2">Set Team Profile</h3>
              <p className="text-sm text-muted mb-4">
                Get personalized trade recommendations based on your team's timeline and strategy.
              </p>
              <Button asChild variant="secondary">
                <a href="/team">Set Team Profile</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-testid="result-recos">
      <CardHeader>
        <CardTitle className="text-lg">Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, index) => {
            const Icon = rec.icon
            return (
              <div key={index} className="flex items-start space-x-3 p-3 bg-muted/20 rounded-lg">
                <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-fg">{rec.text}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {rec.type === 'suggestion' ? 'Suggestion' : 
                     rec.type === 'balance' ? 'Balance' : 'Strategy'}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
