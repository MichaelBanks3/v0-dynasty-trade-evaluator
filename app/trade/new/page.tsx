"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { PlayerSearch } from "@/components/PlayerSearch"
import { TradeBuilder } from "@/components/TradeBuilder"
import { TradeSummary } from "@/components/TradeSummary"
import { useTradeStore } from "@/lib/store"
import { HelpCircle } from "lucide-react"

export default function NewTradePage() {
  const router = useRouter()
  const {
    teamAAssets,
    teamBAssets,
    leagueSettings,
    addAssetToTeam,
    removeAssetFromTeam,
    updateLeagueSettings,
    getTeamTotal,
  } = useTradeStore()

  const [selectedTeam, setSelectedTeam] = useState<"A" | "B">("A")

  const teamATotal = getTeamTotal("A")
  const teamBTotal = getTeamTotal("B")

  const handleEvaluateTrade = () => {
    if (teamAAssets.length === 0 || teamBAssets.length === 0) {
      alert("Please add assets to both teams before evaluating the trade.")
      return
    }

    // Navigate to results page with current trade data
    router.push("/trade/result")
  }

  const allSelectedAssets = [...teamAAssets, ...teamBAssets]

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
              <Link href="/trade/new" className="text-foreground font-medium">
                Create Trade
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Trade Builder Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create Trade</h1>
          <p className="text-muted-foreground mt-2">Build and evaluate your dynasty trade</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Search and Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Player Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PlayerSearch
                  onSelectAsset={(asset) => addAssetToTeam(selectedTeam, asset)}
                  selectedAssets={allSelectedAssets}
                />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Add to:</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant={selectedTeam === "A" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTeam("A")}
                      className="flex-1"
                    >
                      Team A
                    </Button>
                    <Button
                      variant={selectedTeam === "B" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTeam("B")}
                      className="flex-1"
                    >
                      Team B
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* League Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">League Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="superflex" className="text-sm">
                      Superflex
                    </Label>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" title="Increases QB values by 20%" />
                  </div>
                  <Switch
                    id="superflex"
                    checked={leagueSettings.superflex}
                    onCheckedChange={(checked) => updateLeagueSettings({ superflex: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="te-premium" className="text-sm">
                      TE Premium
                    </Label>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" title="Increases TE values by 15%" />
                  </div>
                  <Switch
                    id="te-premium"
                    checked={leagueSettings.tePremium}
                    onCheckedChange={(checked) => updateLeagueSettings({ tePremium: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Trade Summary */}
            <TradeSummary teamATotal={teamATotal} teamBTotal={teamBTotal} />
          </div>

          {/* Trade Builder Columns */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TradeBuilder
                teamLabel="Team A"
                assets={teamAAssets}
                total={teamATotal}
                onRemoveAsset={(assetId) => removeAssetFromTeam("A", assetId)}
                testId="team-a-builder"
              />

              <TradeBuilder
                teamLabel="Team B"
                assets={teamBAssets}
                total={teamBTotal}
                onRemoveAsset={(assetId) => removeAssetFromTeam("B", assetId)}
                testId="team-b-builder"
              />
            </div>

            <Separator className="my-6" />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleEvaluateTrade}
                size="lg"
                className="flex-1"
                disabled={teamAAssets.length === 0 || teamBAssets.length === 0}
                data-testid="evaluate-trade-button"
              >
                Evaluate Trade
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.location.reload()}>
                Clear Trade
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
