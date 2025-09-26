"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TrendingUp, TrendingDown, Minus, Copy, Info } from "lucide-react"
import { useState } from "react"

interface ResultsHeaderProps {
  verdict: string
  teamANow: number
  teamAFuture: number
  teamBNow: number
  teamBFuture: number
  teamAComposite: number
  teamBComposite: number
  explanation: string
}

export function ResultsHeader({
  verdict,
  teamANow,
  teamAFuture,
  teamBNow,
  teamBFuture,
  teamAComposite,
  teamBComposite,
  explanation
}: ResultsHeaderProps) {
  const [copied, setCopied] = useState(false)

  const getVerdictIcon = () => {
    switch (verdict) {
      case 'FAVORS_A':
        return <TrendingUp className="h-5 w-5 text-blue-600" />
      case 'FAVORS_B':
        return <TrendingDown className="h-5 w-5 text-purple-600" />
      case 'FAIR':
        return <Minus className="h-5 w-5 text-green-600" />
      default:
        return <Minus className="h-5 w-5 text-muted" />
    }
  }

  const getVerdictColor = () => {
    switch (verdict) {
      case 'FAVORS_A':
        return 'bg-blue-50 text-blue-700 border-[color:var(--border)]'
      case 'FAVORS_B':
        return 'bg-purple-50 text-purple-700 border-[color:var(--border)]'
      case 'FAIR':
        return 'bg-green-50 text-green-700 border-[color:var(--border)]'
      default:
        return 'bg-muted/20 text-fg border-[color:var(--border)]'
    }
  }

  const getVerdictText = () => {
    const delta = Math.abs(teamAComposite - teamBComposite)
    const max = Math.max(teamAComposite, teamBComposite)
    const percentage = Math.round((delta / max) * 100)

    switch (verdict) {
      case 'FAVORS_A':
        return `Favors Team A by ${percentage}%`
      case 'FAVORS_B':
        return `Favors Team B by ${percentage}%`
      case 'FAIR':
        return 'Even Trade'
      default:
        return 'Unknown'
    }
  }

  const copyBreakdown = async () => {
    const breakdown = `Trade Evaluation Results:
${getVerdictText()}

Team A: ${teamAComposite.toLocaleString()} points
- Now: ${teamANow.toLocaleString()} (${Math.round((teamANow / teamAComposite) * 100)}%)
- Future: ${teamAFuture.toLocaleString()} (${Math.round((teamAFuture / teamAComposite) * 100)}%)

Team B: ${teamBComposite.toLocaleString()} points
- Now: ${teamBNow.toLocaleString()} (${Math.round((teamBNow / teamBComposite) * 100)}%)
- Future: ${teamBFuture.toLocaleString()} (${Math.round((teamBFuture / teamBComposite) * 100)}%)

${explanation}`
    
    try {
      await navigator.clipboard.writeText(breakdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy breakdown:', error)
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        {/* Main Verdict */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getVerdictIcon()}
            <h2 className="text-2xl font-bold">{getVerdictText()}</h2>
            <Badge className={`${getVerdictColor()} font-medium`}>
              {verdict.replace('_', ' ')}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyBreakdown}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Breakdown'}
          </Button>
        </div>

        {/* Composite Totals */}
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <span>Team A: <span className="font-semibold text-foreground">{teamAComposite.toLocaleString()}</span> points</span>
          <span>Team B: <span className="font-semibold text-foreground">{teamBComposite.toLocaleString()}</span> points</span>
        </div>

        {/* Now vs Future Bars */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Now vs Future Breakdown</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger aria-label="Learn about Now vs Future breakdown">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Now: Current season value based on projections and market</p>
                  <p>Future: Long-term dynasty value considering age and potential</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Team A */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Team A</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Now</span>
                  <span className="font-medium">{teamANow.toLocaleString()}</span>
                </div>
                <div 
                  className="w-full bg-muted/30 rounded-full h-2"
                  role="progressbar"
                  aria-valuenow={teamANow}
                  aria-valuemin={0}
                  aria-valuemax={teamAComposite}
                  aria-label={`Team A Now value: ${teamANow.toLocaleString()} points`}
                >
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(teamANow / teamAComposite) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Future</span>
                  <span className="font-medium">{teamAFuture.toLocaleString()}</span>
                </div>
                <div 
                  className="w-full bg-muted/30 rounded-full h-2"
                  role="progressbar"
                  aria-valuenow={teamAFuture}
                  aria-valuemin={0}
                  aria-valuemax={teamAComposite}
                  aria-label={`Team A Future value: ${teamAFuture.toLocaleString()} points`}
                >
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(teamAFuture / teamAComposite) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Team B */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Team B</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Now</span>
                  <span className="font-medium">{teamBNow.toLocaleString()}</span>
                </div>
                <div 
                  className="w-full bg-muted/30 rounded-full h-2"
                  role="progressbar"
                  aria-valuenow={teamBNow}
                  aria-valuemin={0}
                  aria-valuemax={teamBComposite}
                  aria-label={`Team B Now value: ${teamBNow.toLocaleString()} points`}
                >
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(teamBNow / teamBComposite) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Future</span>
                  <span className="font-medium">{teamBFuture.toLocaleString()}</span>
                </div>
                <div 
                  className="w-full bg-muted/30 rounded-full h-2"
                  role="progressbar"
                  aria-valuenow={teamBFuture}
                  aria-valuemin={0}
                  aria-valuemax={teamBComposite}
                  aria-label={`Team B Future value: ${teamBFuture.toLocaleString()} points`}
                >
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(teamBFuture / teamBComposite) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">{explanation}</p>
        </div>
      </CardContent>
    </Card>
  )
}
