"use client"

import { useTradeStore, type Asset } from "@/lib/store"
import { TradeResultCardV2 } from "@/components/TradeResultCardV2"
import { ResultsHeader } from "@/components/ResultsHeader"
import { BalancingSuggestion } from "@/components/BalancingSuggestion"
import { FeedbackWidget } from "@/components/FeedbackWidget"
import { AdvisorWithRecommendations } from "@/components/AdvisorPanel"
import { LeagueBenchmarkChips } from "@/components/LeagueBenchmarkChips"
import { WinNowFutureChart } from "@/components/WinNowFutureChart"
import { TradeSummary } from "@/components/TradeSummary"
import { SettingsDrawer } from "@/components/SettingsDrawer"
import { ActiveSettings } from "@/components/ActiveSettings"
import { safeArray } from "@/lib/safe"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { LeagueSettings, DEFAULT_SETTINGS } from "@/lib/settings"

export default function TradeResultPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return <TradeResultPageContent />
}

function TradeResultPageContent() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<LeagueSettings>(DEFAULT_SETTINGS)
  const [leagueInfo, setLeagueInfo] = useState<{ leagueId?: string; teamId?: string } | null>(null)

  // Use store selectors directly for reactivity
  const teamAAssets = useTradeStore((state: any) => state.teamAAssets)
  const teamBAssets = useTradeStore((state: any) => state.teamBAssets)

  // Safely get arrays
  const safeTeamAAssets = safeArray(teamAAssets)
  const safeTeamBAssets = safeArray(teamBAssets)

  useEffect(() => {
    if (safeTeamAAssets.length === 0 && safeTeamBAssets.length === 0) {
      return
    }

    setLoading(true)
    setError(null)

    // Call the proper evaluation API
    const evaluateTrade = async () => {
      try {
        // Use asset IDs directly for the new evaluation API

        const response = await fetch('/api/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamA: safeTeamAAssets.map((asset: any) => asset.id),
            teamB: safeTeamBAssets.map((asset: any) => asset.id),
            settings: settings
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to evaluate trade')
        }

        const evaluationResult = await response.json()
        setResult(evaluationResult)
      } catch (error) {
        console.error('Error evaluating trade:', error)
        setError('Failed to evaluate trade. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    evaluateTrade()
  }, [safeTeamAAssets, safeTeamBAssets, settings])

  // Fetch league information from team profile
  useEffect(() => {
    const fetchLeagueInfo = async () => {
      try {
        const response = await fetch('/api/team/profile')
        if (response.ok) {
          const profile = await response.json()
          // Check if profile has league information
          if (profile.leagueId && profile.teamId) {
            setLeagueInfo({
              leagueId: profile.leagueId,
              teamId: profile.teamId
            })
          }
        }
      } catch (error) {
        console.error('Error fetching league info:', error)
      }
    }

    fetchLeagueInfo()
  }, [])

  if (safeTeamAAssets.length === 0 && safeTeamBAssets.length === 0) {
  return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">No Trade Data</h1>
            <p className="text-muted-foreground mb-6">
              It looks like you haven't created a trade yet. Go back to create your first trade evaluation.
            </p>
            <Button asChild>
              <a href="/trade">Create Trade</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Evaluating your trade...</p>
          </div>
        </div>
                  </div>
    )
  }

  if (error) {
                      return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Evaluation Error</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <a href="/trade">Try Again</a>
            </Button>
                            </div>
                          </div>
                        </div>
                      )
  }

  if (!result) {
                      return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">No Results</h1>
            <p className="text-muted-foreground mb-6">Unable to evaluate the trade.</p>
            <Button asChild>
              <a href="/trade">Try Again</a>
              </Button>
                  </div>
                </div>
              </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Trade Evaluation Results</h1>
          <SettingsDrawer onSettingsChange={setSettings} currentSettings={settings} />
        </div>
        
        <div className="mb-6">
          <ActiveSettings settings={settings} />
        </div>

        {/* Results Header */}
        <ResultsHeader
          verdict={result.verdict}
          teamANow={result.totals.teamA.nowScore}
          teamAFuture={result.totals.teamA.futureScore}
          teamBNow={result.totals.teamB.nowScore}
          teamBFuture={result.totals.teamB.futureScore}
          teamAComposite={result.totals.teamA.compositeValue}
          teamBComposite={result.totals.teamB.compositeValue}
          explanation={result.explanation}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Trade Details */}
          <div className="space-y-6">
            <TradeResultCardV2 result={result} settings={settings} />
            
            {/* Balancing Suggestion */}
            <BalancingSuggestion
              suggestion={result.suggestion}
              delta={Math.abs(result.totals.teamA.compositeValue - result.totals.teamB.compositeValue) / Math.max(result.totals.teamA.compositeValue, result.totals.teamB.compositeValue)}
            />

            {/* Feedback Widget */}
            <FeedbackWidget 
              tradeSlug={result.slug}
              settingsHash={settings ? JSON.stringify(settings) : undefined}
            />

            {/* League Benchmark Chips */}
            {leagueInfo && (
              <LeagueBenchmarkChips
                leagueId={leagueInfo.leagueId}
                teamId={leagueInfo.teamId}
              />
            )}

            {/* Trade Finder CTA */}
            {leagueInfo && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Find Trades vs Opponents</h4>
                      <p className="text-sm text-muted-foreground">
                        Get personalized trade proposals based on your league
                      </p>
                    </div>
                    <Button asChild>
                      <a href={`/league/${leagueInfo.leagueId}?findTrades=true`}>
                        Find Trades
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

              {/* Advisor Panel */}
              <AdvisorWithRecommendations
                teamAAssets={safeTeamAAssets.map((asset: any) => asset.id)}
                teamBAssets={safeTeamBAssets.map((asset: any) => asset.id)}
                settings={settings}
              />
            </div>
          
          {/* Right Column - Analysis */}
          <div className="space-y-6">
            {/* Fairness Analysis */}
            <TradeSummary 
              teamATotal={result.totalA} 
              teamBTotal={result.totalB} 
            />
            
            {/* Win-Now vs Future Analysis */}
            <WinNowFutureChart 
              winNowScore={result.teamAWinNow + result.teamBWinNow}
              futureScore={result.teamAFuture + result.teamBFuture}
            />
          </div>
        </div>
      </div>
    </div>
  )
}