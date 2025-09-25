"use client"

import { useTradeStore, type Asset } from "@/lib/store"
import { TradeResultCardV2 } from "@/components/TradeResultCardV2"
import { BalancingSuggestion } from "@/components/BalancingSuggestion"
import { FeedbackWidget } from "@/components/FeedbackWidget"
import { AdvisorWithRecommendations } from "@/components/AdvisorPanel"
import { LeagueBenchmarkChips } from "@/components/LeagueBenchmarkChips"
import { SettingsDrawer } from "@/components/SettingsDrawer"
import { ActiveSettings } from "@/components/ActiveSettings"
import { safeArray } from "@/lib/safe"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, TrendingUp, TrendingDown, Minus, Copy, Info } from "lucide-react"
import { useEffect, useState } from "react"
import { LeagueSettings, DEFAULT_SETTINGS } from "@/lib/settings"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { StatBar } from "@/components/ui/StatBar"
import { formatPts, safeNumber } from "@/lib/format"
import { GuestBanner } from "@/components/GuestBanner"
import { useAuth } from "@clerk/nextjs"

export default function TradeResultPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-subtext">Loading...</p>
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
  const { isSignedIn } = useAuth()

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
      <div className="space-y-6">
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 text-subtext mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-2">No Trade Data</h1>
          <p className="text-subtext mb-6">
            It looks like you haven't created a trade yet. Go back to create your first trade evaluation.
          </p>
          <Button asChild className="bg-accent text-accent-contrast hover:bg-accent/90">
            <a href="/trade">Create Trade</a>
          </Button>
            </div>
          </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-subtext">Evaluating your trade...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 text-danger mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-2">Evaluation Error</h1>
          <p className="text-subtext mb-6">{error}</p>
          <Button asChild className="bg-accent text-accent-contrast hover:bg-accent/90">
            <a href="/trade">Try Again</a>
          </Button>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 text-subtext mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-2">No Results</h1>
          <p className="text-subtext mb-6">Unable to evaluate the trade.</p>
          <Button asChild className="bg-accent text-accent-contrast hover:bg-accent/90">
            <a href="/trade">Try Again</a>
          </Button>
        </div>
          </div>
    )
  }

  // Calculate totals from assets
  const teamATotal = (safeTeamAAssets as Asset[]).reduce((sum: number, asset: Asset) => sum + safeNumber(asset?.value), 0)
  const teamBTotal = (safeTeamBAssets as Asset[]).reduce((sum: number, asset: Asset) => sum + safeNumber(asset?.value), 0)
  
  // Get verdict display
  const getVerdictDisplay = () => {
    const delta = Math.abs(safeNumber(result.totals.teamA.compositeValue) - safeNumber(result.totals.teamB.compositeValue))
    const max = Math.max(safeNumber(result.totals.teamA.compositeValue), safeNumber(result.totals.teamB.compositeValue))
    const percentage = max > 0 ? Math.round((delta / max) * 100) : 0

    switch (result.verdict) {
      case 'FAVORS_A':
        return { text: `Favors Team A by ${percentage}%`, icon: TrendingUp, color: 'text-blue-600' }
      case 'FAVORS_B':
        return { text: `Favors Team B by ${percentage}%`, icon: TrendingDown, color: 'text-purple-600' }
      case 'FAIR':
        return { text: 'Even Trade', icon: Minus, color: 'text-green-600' }
      default:
        return { text: 'Unknown', icon: Minus, color: 'text-gray-600' }
    }
  }

  const verdictDisplay = getVerdictDisplay()
  const VerdictIcon = verdictDisplay.icon

  // Copy breakdown function
  const copyBreakdown = async () => {
    const breakdown = `Trade Evaluation Results:
${verdictDisplay.text}

Team A: ${result.totals.teamA.compositeValue.toLocaleString()} points
- Now: ${result.totals.teamA.nowScore.toLocaleString()} (${Math.round((result.totals.teamA.nowScore / result.totals.teamA.compositeValue) * 100)}%)
- Future: ${result.totals.teamA.futureScore.toLocaleString()} (${Math.round((result.totals.teamA.futureScore / result.totals.teamA.compositeValue) * 100)}%)

Team B: ${result.totals.teamB.compositeValue.toLocaleString()} points
- Now: ${result.totals.teamB.nowScore.toLocaleString()} (${Math.round((result.totals.teamB.nowScore / result.totals.teamB.compositeValue) * 100)}%)
- Future: ${result.totals.teamB.futureScore.toLocaleString()} (${Math.round((result.totals.teamB.futureScore / result.totals.teamB.compositeValue) * 100)}%)

${result.explanation}`
    
    try {
      await navigator.clipboard.writeText(breakdown)
    } catch (error) {
      console.error('Failed to copy breakdown:', error)
    }
  }

  return (
    <div className="space-y-6">
      {!isSignedIn && <GuestBanner />}
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text">Trade Evaluation Results</h1>
        <SettingsDrawer onSettingsChange={setSettings} currentSettings={settings} />
      </div>
      
      <div>
        <ActiveSettings settings={settings} />
      </div>

      {/* Three Main Cards Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Verdict + Score Breakdown */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Trade Verdict</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyBreakdown}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Main Verdict */}
                <div className="flex items-center gap-3">
                  <VerdictIcon className={`h-6 w-6 ${verdictDisplay.color}`} />
                  <h2 className="text-xl font-bold">{verdictDisplay.text}</h2>
                </div>

                {/* Now vs Future Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Now vs Future</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Now: Current season value</p>
                          <p>Future: Long-term dynasty value</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Team A */}
                    <div>
                      <div className="text-xs text-subtext mb-2">Team A</div>
                      <div className="space-y-2">
                        <StatBar
                          label="Now"
                          value={result.totals.teamA.nowScore}
                          max={result.totals.teamA.compositeValue}
                          tone="blue"
                        />
                        <StatBar
                          label="Future"
                          value={result.totals.teamA.futureScore}
                          max={result.totals.teamA.compositeValue}
                          tone="green"
                        />
                  </div>
                </div>

                    {/* Team B */}
                    <div>
                      <div className="text-xs text-subtext mb-2">Team B</div>
                      <div className="space-y-2">
                        <StatBar
                          label="Now"
                          value={result.totals.teamB.nowScore}
                          max={result.totals.teamB.compositeValue}
                          tone="blue"
                        />
                        <StatBar
                          label="Future"
                          value={result.totals.teamB.futureScore}
                          max={result.totals.teamB.compositeValue}
                          tone="green"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Team Assets with Values */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Team Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Team A Assets */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Team A</div>
                  <div className="space-y-2">
                        {safeTeamAAssets.length > 0 ? (
                          (safeTeamAAssets as Asset[]).map((asset: Asset, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="truncate">{asset.label}</span>
                              <Badge variant="outline">{formatPts(asset.value)}</Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-subtext">No assets</div>
                        )}
                  </div>
                </div>

                {/* Team B Assets */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Team B</div>
                  <div className="space-y-2">
                        {safeTeamBAssets.length > 0 ? (
                          (safeTeamBAssets as Asset[]).map((asset: Asset, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="truncate">{asset.label}</span>
                              <Badge variant="outline">{formatPts(asset.value)}</Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-subtext">No assets</div>
                        )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Trade Summary with Totals and Fairness */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Trade Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-subtext">Team A Total</span>
                    <Badge variant="outline">{formatPts(teamATotal)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-subtext">Team B Total</span>
                    <Badge variant="outline">{formatPts(teamBTotal)}</Badge>
                  </div>
                </div>

                {/* Fairness */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Fairness</span>
                    <div className="flex items-center space-x-2">
                      <VerdictIcon className="h-4 w-4" />
                      <Badge variant="secondary">{verdictDisplay.text}</Badge>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">{result.explanation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Additional Sections */}
      <div className="space-y-6">
          {/* Balancing Suggestion */}
          {result.suggestion && (
            <BalancingSuggestion
              suggestion={result.suggestion}
              delta={Math.abs(result.totals.teamA.compositeValue - result.totals.teamB.compositeValue) / Math.max(result.totals.teamA.compositeValue, result.totals.teamB.compositeValue)}
            />
          )}

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

          {/* Feedback Widget */}
          <FeedbackWidget 
            tradeSlug={result.slug}
            settingsHash={settings ? JSON.stringify(settings) : undefined}
          />
      </div>
    </div>
  )
}