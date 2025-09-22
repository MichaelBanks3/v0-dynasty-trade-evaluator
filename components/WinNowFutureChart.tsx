"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface WinNowFutureChartProps {
  winNowScore: number
  futureScore: number
}

export function WinNowFutureChart({ winNowScore, futureScore }: WinNowFutureChartProps) {
  const total = winNowScore + futureScore
  const winNowPercentage = total > 0 ? (winNowScore / total) * 100 : 50
  const futurePercentage = total > 0 ? (futureScore / total) * 100 : 50

  const getWinNowLabel = () => {
    if (winNowPercentage > 65) return "Strong Win-Now"
    if (winNowPercentage > 55) return "Lean Win-Now"
    if (winNowPercentage < 35) return "Strong Future"
    if (winNowPercentage < 45) return "Lean Future"
    return "Balanced"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Win-Now vs Future</CardTitle>
          <Badge variant="outline">{getWinNowLabel()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="relative h-8 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
              style={{ width: `${winNowPercentage}%` }}
            />
            <div
              className="absolute right-0 top-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${futurePercentage}%` }}
            />
          </div>

          {/* Labels */}
          <div className="flex justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
              <span className="text-muted-foreground">Win-Now</span>
              <Badge variant="secondary">{Math.round(winNowPercentage)}%</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{Math.round(futurePercentage)}%</Badge>
              <span className="text-muted-foreground">Future</span>
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
            </div>
          </div>

          {/* Explanation */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p>
              <strong>Win-Now:</strong> Players in their prime (ages 24-29) and proven veterans
            </p>
            <p className="mt-1">
              <strong>Future:</strong> Young players (under 24), draft picks, and long-term assets
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
