"use client"

import { TradeBuilder } from "@/components/TradeBuilder"
import { TradeSummary } from "@/components/TradeSummary"
import { AuthEnvBanner } from "@/components/AuthEnvBanner"
import { useTradeStore, type Asset } from "@/lib/store"
import { safeArray } from "@/lib/safe"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function TradePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Create Trade</h1>
            <p className="text-muted-foreground mt-2">
              Build and evaluate your dynasty fantasy football trade
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TradeBuilder />
            </div>
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Trade Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <TradePageContent />
}

function TradePageContent() {
  const { teamAAssets, teamBAssets } = useTradeStore()
  const router = useRouter()

  // Safely get arrays and compute totals
  const safeTeamAAssets = safeArray(teamAAssets)
  const safeTeamBAssets = safeArray(teamBAssets)

  const teamATotal = safeTeamAAssets.reduce((sum: number, asset: Asset) => sum + (asset?.value || 0), 0)
  const teamBTotal = safeTeamBAssets.reduce((sum: number, asset: Asset) => sum + (asset?.value || 0), 0)

  const handleEvaluate = () => {
    if (safeTeamAAssets.length === 0 && safeTeamBAssets.length === 0) {
      alert("Please add at least one player or pick to one of the teams")
      return
    }
    router.push("/trade/result")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Trade Builder Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AuthEnvBanner />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create Trade</h1>
          <p className="text-muted-foreground mt-2">
            Build and evaluate your dynasty fantasy football trade
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trade Builder */}
          <div className="lg:col-span-2">
            <TradeBuilder />
          </div>

          {/* Trade Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Trade Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <TradeSummary teamATotal={teamATotal} teamBTotal={teamBTotal} />
                
                <div className="mt-6">
                  <Button 
                    onClick={handleEvaluate}
                    className="w-full"
                    disabled={safeTeamAAssets.length === 0 && safeTeamBAssets.length === 0}
                  >
                    Evaluate Trade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}