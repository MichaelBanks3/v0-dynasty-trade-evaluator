"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { WinNowFutureChart } from "@/components/WinNowFutureChart"
import { useTradeStore } from "@/lib/store"
import { ArrowLeft, Edit, Save, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useEffect, useState } from "react"

export default function TradeResultPage() {
  const router = useRouter()
  const { teamAAssets, teamBAssets, leagueSettings, getTeamTotal } = useTradeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if no trade data
  useEffect(() => {
    if (mounted && teamAAssets.length === 0 && teamBAssets.length === 0) {
      router.push("/trade/new")
    }
  }, [mounted, teamAAssets.length, teamBAssets.length, router])

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  const teamATotal = getTeamTotal("A")
  const teamBTotal = getTeamTotal("B")
  const difference = Math.abs(teamATotal - teamBTotal)
  const percentageDiff = teamATotal > 0 && teamBTotal > 0 ? (difference / Math.max(teamATotal, teamBTotal)) * 100 : 0

  const getFairnessResult = () => {
    if (percentageDiff < 5)
      return { text: "Even", variant: "secondary" as const, icon: Minus, color: "text-muted-foreground" }
    if (percentageDiff < 15) {
      return {
        text: teamATotal > teamBTotal ? "Slightly Favors Team A" : "Slightly Favors Team B",
        variant: "outline" as const,
        icon: teamATotal > teamBTotal ? TrendingUp : TrendingDown,
        color: teamATotal > teamBTotal ? "text-green-600" : "text-blue-600",
      }
    }
    return {
      text: teamATotal > teamBTotal ? "Leans Team A" : "Leans Team B",
      variant: "default" as const,
      icon: teamATotal > teamBTotal ? TrendingUp : TrendingDown,
      color: teamATotal > teamBTotal ? "text-green-600" : "text-blue-600",
    }
  }

  const fairness = getFairnessResult()
  const IconComponent = fairness.icon

  // Calculate win-now vs future scores
  const calculateWinNowFutureScores = () => {
    let winNowScore = 0
    let futureScore = 0

    const allAssets = [...teamAAssets, ...teamBAssets]

    allAssets.forEach((asset) => {
      if (asset.type === "pick") {
        futureScore += asset.baseValue
      } else {
        const player = asset as any
        if (player.age <= 23) {
          futureScore += asset.baseValue * 0.8 // Young players lean future
          winNowScore += asset.baseValue * 0.2
        } else if (player.age <= 26) {
          winNowScore += asset.baseValue * 0.7 // Prime players lean win-now
          futureScore += asset.baseValue * 0.3
        } else if (player.age <= 29) {
          winNowScore += asset.baseValue * 0.9 // Peak players heavily win-now
          futureScore += asset.baseValue * 0.1
        } else {
          winNowScore += asset.baseValue // Veterans are pure win-now
        }
      }
    })

    return { winNowScore, futureScore }
  }

  const { winNowScore, futureScore } = calculateWinNowFutureScores()

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-foreground">
                Dynasty Trade Evaluator
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/trade/new" className="text-muted-foreground hover:text-foreground">
                Create Trade
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Results Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trade Evaluation</h1>
            <p className="text-muted-foreground mt-2">Analysis of your dynasty trade</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Trade Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Fairness Meter */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <IconComponent className={`h-6 w-6 ${fairness.color}`} />
                    <Badge variant={fairness.variant} className="text-lg px-4 py-2">
                      {fairness.text}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {percentageDiff < 5
                      ? "This trade is very balanced with minimal value difference."
                      : percentageDiff < 15
                        ? "This trade has a slight value imbalance but is still reasonable."
                        : "This trade has a significant value imbalance."}
                  </div>
                </div>

                <Separator />

                {/* Team Totals */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground mb-2">Team A</h3>
                    <div className="text-3xl font-bold text-foreground">{Math.round(teamATotal)}</div>
                    <div className="text-sm text-muted-foreground">Total Value</div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground mb-2">Team B</h3>
                    <div className="text-3xl font-bold text-foreground">{Math.round(teamBTotal)}</div>
                    <div className="text-sm text-muted-foreground">Total Value</div>
                  </div>
                </div>

                {/* League Settings Applied */}
                {(leagueSettings.superflex || leagueSettings.tePremium) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-foreground mb-2">League Settings Applied</h4>
                      <div className="flex flex-wrap gap-2">
                        {leagueSettings.superflex && <Badge variant="outline">Superflex (+20% QB value)</Badge>}
                        {leagueSettings.tePremium && <Badge variant="outline">TE Premium (+15% TE value)</Badge>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Win-Now vs Future Chart */}
          <div className="lg:col-span-1">
            <WinNowFutureChart winNowScore={winNowScore} futureScore={futureScore} />
          </div>

          {/* Transparent Breakdown */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-xl">Transparent Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team A Assets */}
                <div>
                  <h3 className="font-semibold text-foreground mb-4 flex items-center justify-between">
                    Team A Assets
                    <Badge variant="outline">Subtotal: {Math.round(teamATotal)}</Badge>
                  </h3>
                  <div className="space-y-3">
                    {teamAAssets.map((asset) => {
                      let adjustedValue = asset.baseValue
                      if ("position" in asset) {
                        if (leagueSettings.superflex && asset.position === "QB") {
                          adjustedValue *= 1.2
                        }
                        if (leagueSettings.tePremium && asset.position === "TE") {
                          adjustedValue *= 1.15
                        }
                      }

                      return (
                        <div key={asset.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">{asset.label}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={asset.type === "player" ? "default" : "secondary"} className="text-xs">
                                {asset.type === "player" ? (asset as any).position : "Pick"}
                              </Badge>
                              {asset.type === "player" && (
                                <span className="text-xs text-muted-foreground">Age {(asset as any).age}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-foreground">{Math.round(adjustedValue)}</div>
                            {adjustedValue !== asset.baseValue && (
                              <div className="text-xs text-muted-foreground">Base: {asset.baseValue}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Team B Assets */}
                <div>
                  <h3 className="font-semibold text-foreground mb-4 flex items-center justify-between">
                    Team B Assets
                    <Badge variant="outline">Subtotal: {Math.round(teamBTotal)}</Badge>
                  </h3>
                  <div className="space-y-3">
                    {teamBAssets.map((asset) => {
                      let adjustedValue = asset.baseValue
                      if ("position" in asset) {
                        if (leagueSettings.superflex && asset.position === "QB") {
                          adjustedValue *= 1.2
                        }
                        if (leagueSettings.tePremium && asset.position === "TE") {
                          adjustedValue *= 1.15
                        }
                      }

                      return (
                        <div key={asset.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">{asset.label}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={asset.type === "player" ? "default" : "secondary"} className="text-xs">
                                {asset.type === "player" ? (asset as any).position : "Pick"}
                              </Badge>
                              {asset.type === "player" && (
                                <span className="text-xs text-muted-foreground">Age {(asset as any).age}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-foreground">{Math.round(adjustedValue)}</div>
                            {adjustedValue !== asset.baseValue && (
                              <div className="text-xs text-muted-foreground">Base: {asset.baseValue}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/trade/new" className="flex-1">
                <Button variant="outline" size="lg" className="w-full bg-transparent">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Trade
                </Button>
              </Link>
              <Button size="lg" className="flex-1" disabled>
                <Save className="h-4 w-4 mr-2" />
                Save Trade (Coming Soon)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
