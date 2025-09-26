"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface VerdictCardProps {
  verdict: string
  teamATotal: number
  teamBTotal: number
}

export function VerdictCard({ verdict, teamATotal, teamBTotal }: VerdictCardProps) {
  const delta = Math.abs(teamATotal - teamBTotal)
  const max = Math.max(teamATotal, teamBTotal)
  const percentage = max > 0 ? Math.round((delta / max) * 100) : 0

  const getVerdictDisplay = () => {
    switch (verdict) {
      case 'FAVORS_A':
        return {
          text: 'Favors A',
          icon: TrendingUp,
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          subLabel: `Leans A by ${percentage}%`
        }
      case 'FAVORS_B':
        return {
          text: 'Favors B',
          icon: TrendingDown,
          color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          subLabel: `Leans B by ${percentage}%`
        }
      case 'FAIR':
        return {
          text: 'Fair',
          icon: Minus,
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          subLabel: percentage > 0 ? `Within ±${percentage}%` : 'Even trade'
        }
      default:
        return {
          text: 'Unknown',
          icon: Minus,
          color: 'bg-muted/20 text-muted border-[color:var(--border)]',
          subLabel: 'Unable to determine'
        }
    }
  }

  const verdictDisplay = getVerdictDisplay()
  const VerdictIcon = verdictDisplay.icon

  return (
    <Card data-testid="result-verdict">
      <CardHeader>
        <CardTitle className="text-lg">Trade Verdict</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          {/* Big Badge */}
          <div className="flex justify-center">
            <Badge 
              variant="outline" 
              className={`${verdictDisplay.color} text-lg px-6 py-3 font-semibold`}
            >
              <VerdictIcon className="h-5 w-5 mr-2" />
              {verdictDisplay.text}
            </Badge>
          </div>
          
          {/* Delta */}
          <div className="text-2xl font-bold text-fg">
            {delta > 0 ? `${delta.toLocaleString()}` : '0'} pts
          </div>
          
          {/* Sub-label */}
          <div className="text-sm text-muted">
            {verdictDisplay.subLabel}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
