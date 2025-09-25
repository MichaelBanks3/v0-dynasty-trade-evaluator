"use client"

import { TradeBuilder } from "@/components/TradeBuilder"
import { AuthEnvBanner } from "@/components/AuthEnvBanner"
import { OnboardingPanel } from "@/components/OnboardingPanel"
import { useTradeStore, type Asset } from "@/lib/store"
import { safeArray } from "@/lib/safe"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useGlobalKeyboard } from "@/hooks/use-global-keyboard"
import { TrendingUp, TrendingDown, Minus, Users, Calendar } from "lucide-react"

export default function TradePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Create Trade</h1>
          <p className="text-subtext mt-2">
            Build and evaluate your dynasty fantasy football trade
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TradeBuilder />
          </div>
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Trade Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-subtext">
                  Add players or picks to see trade summary
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return <TradePageContent />
}

function TradePageContent() {
  const router = useRouter()
  const { searchInputRef } = useGlobalKeyboard()

  // Use store selectors directly for reactivity
  const teamAAssets = useTradeStore((state: any) => state.teamAAssets)
  const teamBAssets = useTradeStore((state: any) => state.teamBAssets)

  // Safely get arrays and compute totals
  const safeTeamAAssets = safeArray(teamAAssets)
  const safeTeamBAssets = safeArray(teamBAssets)

  const teamATotal = (safeTeamAAssets as Asset[]).reduce((sum: number, asset: Asset) => sum + (Number(asset?.value) || 0), 0)
  const teamBTotal = (safeTeamBAssets as Asset[]).reduce((sum: number, asset: Asset) => sum + (Number(asset?.value) || 0), 0)

  const handleEvaluate = () => {
    if (safeTeamAAssets.length === 0 && safeTeamBAssets.length === 0) {
      alert("Please add at least one player or pick to one of the teams")
      return
    }
    router.push("/trade/result")
  }

  // Get verdict display
  const getVerdictDisplay = () => {
    const delta = Math.abs(teamATotal - teamBTotal)
    const max = Math.max(teamATotal, teamBTotal)
    const percentage = max > 0 ? Math.round((delta / max) * 100) : 0

    if (percentage < 5) {
      return { text: "Even", icon: Minus, color: "text-green-500" }
    } else if (teamATotal > teamBTotal) {
      return { text: `Favors Team A by ${percentage}%`, icon: TrendingUp, color: "text-blue-500" }
    } else {
      return { text: `Favors Team B by ${percentage}%`, icon: TrendingDown, color: "text-purple-500" }
    }
  }

  const verdictDisplay = getVerdictDisplay()
  const VerdictIcon = verdictDisplay.icon

  return (
    <div className="space-y-6">
      <AuthEnvBanner />
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Create Trade</h1>
            <p className="text-subtext mt-2">
              Build and evaluate your dynasty fantasy football trade
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <a href="/team">Team Profile</a>
            </Button>
            <OnboardingPanel />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade Builder */}
        <div className="lg:col-span-2">
          <TradeBuilder searchInputRef={searchInputRef} />
        </div>

        {/* Trade Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Trade Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {safeTeamAAssets.length === 0 && safeTeamBAssets.length === 0 ? (
                <div className="text-center py-8 text-subtext">
                  Add players or picks to see trade summary
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-subtext">Team A Total</span>
                      <Badge variant="outline">{teamATotal.toLocaleString()}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-subtext">Team B Total</span>
                      <Badge variant="outline">{teamBTotal.toLocaleString()}</Badge>
                    </div>
                  </div>

                  {/* Verdict */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text">Fairness</span>
                      <div className="flex items-center space-x-2">
                        <VerdictIcon className={`h-4 w-4 ${verdictDisplay.color}`} />
                        <Badge variant="secondary">{verdictDisplay.text}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Asset Lists */}
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-subtext mb-2">Team A Assets</div>
                      <div className="space-y-1">
                        {safeTeamAAssets.length > 0 ? (
                          (safeTeamAAssets as Asset[]).map((asset: Asset, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="truncate">{asset.label}</span>
                              <Badge variant="outline">{Number(asset.value || 0).toLocaleString()}</Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-subtext">No assets</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-subtext mb-2">Team B Assets</div>
                      <div className="space-y-1">
                        {safeTeamBAssets.length > 0 ? (
                          (safeTeamBAssets as Asset[]).map((asset: Asset, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="truncate">{asset.label}</span>
                              <Badge variant="outline">{Number(asset.value || 0).toLocaleString()}</Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-subtext">No assets</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={handleEvaluate}
                      className="w-full bg-accent text-accent-contrast hover:bg-accent/90 hover:shadow-glow"
                      disabled={safeTeamAAssets.length === 0 && safeTeamBAssets.length === 0}
                    >
                      Evaluate Trade
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}