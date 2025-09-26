"use client"

import Link from "next/link"
import { useTradeStore, type Asset } from "@/lib/store"
import { TradeResultCardV2 } from "@/components/TradeResultCardV2"
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
import { SiteShell } from "@/components/layout/SiteShell"
import { TradeResultBottom } from "@/components/trade/result/TradeResultBottom"
import { SrOnly } from "@/components/ui/sr-only"

export default function TradeResultPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <SiteShell
        title="Trade Evaluation Results"
        subtitle="Loading..."
      >
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: 'hsl(var(--primary))'}}></div>
            <p className="theme-muted">Loading...</p>
          </div>
      </SiteShell>
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
      <SiteShell
        title="No Trade Data"
        subtitle="It looks like you haven't created a trade yet. Go back to create your first trade evaluation."
        right={
          <Link href="/trade" className="btn-ghost focus-ring">Create Trade</Link>
        }
      >
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 theme-muted mx-auto mb-4" />
        </div>
      </SiteShell>
    )
  }

  if (loading) {
    return (
      <SiteShell
        title="Trade Evaluation Results"
        subtitle="Evaluating your trade..."
      >
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: 'hsl(var(--primary))'}}></div>
          <p className="theme-muted">Evaluating your trade...</p>
        </div>
      </SiteShell>
    )
  }

  if (error) {
    return (
      <SiteShell
        title="Evaluation Error"
        subtitle={error}
        right={
          <Link href="/trade" className="btn-ghost focus-ring">Try Again</Link>
        }
      >
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 theme-muted mx-auto mb-4" />
        </div>
      </SiteShell>
    )
  }

  if (!result) {
    return (
      <SiteShell
        title="No Results"
        subtitle="Unable to evaluate the trade."
        right={
          <Link href="/trade" className="btn-ghost focus-ring">Try Again</Link>
        }
      >
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 theme-muted mx-auto mb-4" />
        </div>
      </SiteShell>
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
        return { text: 'Unknown', icon: Minus, color: 'text-muted' }
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
    <SiteShell
      title="Trade Evaluation Results"
      right={<SettingsDrawer onSettingsChange={setSettings} currentSettings={settings} />}
    >
      {!isSignedIn && <GuestBanner />}
      
      <div className="mb-4">
        <ActiveSettings settings={settings} />
      </div>

      {/* Three Main Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Verdict + Score Breakdown */}
          <div className="theme-card p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Trade Verdict</h2>
              <button
                onClick={copyBreakdown}
                className="btn-ghost focus-ring gap-2"
                aria-label="Copy trade breakdown to clipboard"
              >
                <Copy className="h-4 w-4" />
                Copy
                <SrOnly>Copy trade breakdown to clipboard</SrOnly>
              </button>
            </div>
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
                        <Info className="h-4 w-4 theme-muted" />
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
                    <div className="text-xs theme-muted mb-2">Team A</div>
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
                    <div className="text-xs theme-muted mb-2">Team B</div>
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
          </div>

          {/* Card 2: Team Assets with Values */}
          <div className="theme-card p-6 lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Team Assets</h2>
            <div className="space-y-4">
              {/* Team A Assets */}
              <div>
                <div className="text-sm font-medium theme-muted mb-2">Team A</div>
                <div className="space-y-2">
                  {safeTeamAAssets.length > 0 ? (
                    (safeTeamAAssets as Asset[]).map((asset: Asset, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="truncate">{asset.label}</span>
                        <span className="text-xs theme-muted">{formatPts(asset.value)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm theme-muted">No assets</div>
                  )}
                </div>
              </div>

              {/* Team B Assets */}
              <div>
                <div className="text-sm font-medium theme-muted mb-2">Team B</div>
                <div className="space-y-2">
                  {safeTeamBAssets.length > 0 ? (
                    (safeTeamBAssets as Asset[]).map((asset: Asset, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="truncate">{asset.label}</span>
                        <span className="text-xs theme-muted">{formatPts(asset.value)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm theme-muted">No assets</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Trade Summary with Totals and Fairness */}
          <div className="theme-card p-6 lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Trade Summary</h2>
            <div className="space-y-4">
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm theme-muted">Team A Total</span>
                  <span className="text-xs theme-muted">{formatPts(teamATotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm theme-muted">Team B Total</span>
                  <span className="text-xs theme-muted">{formatPts(teamBTotal)}</span>
                </div>
              </div>

              {/* Fairness */}
              <div className="pt-2 theme-border border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fairness</span>
                  <div className="flex items-center space-x-2">
                    <VerdictIcon className="h-4 w-4" />
                    <span className="chip">{verdictDisplay.text}</span>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="pt-2 theme-border border-t">
                <p className="text-sm theme-muted">{result.explanation}</p>
              </div>
            </div>
          </div>
        </div>

              {/* New Bottom Section */}
              <TradeResultBottom
                result={result}
                settings={settings}
                teamProfile={leagueInfo}
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
                <div className="theme-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Find Trades vs Opponents</h4>
                      <p className="text-sm theme-muted">
                        Get personalized trade proposals based on your league
                      </p>
                    </div>
                    <a href={`/league/${leagueInfo.leagueId}?findTrades=true`} className="btn-primary focus-ring">
                      Find Trades
                    </a>
                  </div>
                </div>
              )}
    </SiteShell>
  )
}