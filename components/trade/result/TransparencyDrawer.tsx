"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Settings, BarChart3, Target, Users } from "lucide-react"

interface TransparencyDrawerProps {
  settings: any
  result: any
}

export function TransparencyDrawer({ settings, result }: TransparencyDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getValuationWeights = () => {
    // Extract weights from the evaluation result or settings
    return {
      marketValue: 0.3,
      projNow: 0.4,
      projFuture: 0.3,
      ageAdjustment: 0.1,
      riskAdjustment: 0.05
    }
  }

  const getLeagueSettings = () => {
    return {
      scoring: settings?.scoring || 'PPR',
      superflex: settings?.superflex || false,
      tePremium: settings?.tePremium || 1.0,
      rosterSize: settings?.rosterSize || 20
    }
  }

  const getMarketVsFutureSplit = () => {
    if (!result?.totals) return { now: 50, future: 50 }
    
    const teamATotal = result.totals.teamA.compositeValue || 0
    const teamBTotal = result.totals.teamB.compositeValue || 0
    const total = teamATotal + teamBTotal
    
    if (total === 0) return { now: 50, future: 50 }
    
    const nowTotal = (result.totals.teamA.nowScore || 0) + (result.totals.teamB.nowScore || 0)
    const futureTotal = (result.totals.teamA.futureScore || 0) + (result.totals.teamB.futureScore || 0)
    
    return {
      now: Math.round((nowTotal / total) * 100),
      future: Math.round((futureTotal / total) * 100)
    }
  }

  const weights = getValuationWeights()
  const leagueSettings = getLeagueSettings()
  const marketSplit = getMarketVsFutureSplit()

  return (
    <Card data-testid="result-transparency">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Valuation Transparency</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="gap-2"
          >
            {isOpen ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show Details
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent>
          <div className="space-y-6">
            {/* Valuation Weights */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-fg">Valuation Weights</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span className="text-sm text-muted">Market Value</span>
                  <Badge variant="outline">{Math.round(weights.marketValue * 100)}%</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span className="text-sm text-muted">Current Season</span>
                  <Badge variant="outline">{Math.round(weights.projNow * 100)}%</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span className="text-sm text-muted">Future Value</span>
                  <Badge variant="outline">{Math.round(weights.projFuture * 100)}%</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span className="text-sm text-muted">Age Adjustment</span>
                  <Badge variant="outline">{Math.round(weights.ageAdjustment * 100)}%</Badge>
                </div>
              </div>
            </div>

            {/* League Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-fg">League Settings</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span className="text-sm text-muted">Scoring</span>
                  <Badge variant="outline">{leagueSettings.scoring}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span className="text-sm text-muted">Superflex</span>
                  <Badge variant="outline">{leagueSettings.superflex ? 'Yes' : 'No'}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span className="text-sm text-muted">TE Premium</span>
                  <Badge variant="outline">{leagueSettings.tePremium}x</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span className="text-sm text-muted">Roster Size</span>
                  <Badge variant="outline">{leagueSettings.rosterSize}</Badge>
                </div>
              </div>
            </div>

            {/* Market vs Future Split */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-fg">Value Distribution</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span className="text-sm text-muted">Win-Now Value</span>
                  <Badge variant="outline">{marketSplit.now}%</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span className="text-sm text-muted">Future Value</span>
                  <Badge variant="outline">{marketSplit.future}%</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
